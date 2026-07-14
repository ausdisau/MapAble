import { randomBytes } from "crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  developerPlatformConfig,
  ensurePartnerWebhooksEnabled,
} from "@/lib/config/developer-platform";
import { prisma } from "@/lib/prisma";
import { hashApiKey } from "@/lib/stripe-billing/checkout-service";
import {
  computeRetryDelayMs,
  hashPayload,
  signWebhookPayload,
} from "@/lib/platform/webhooks/signing";

export async function createWebhookSubscription(input: {
  apiClientId: string;
  url: string;
  eventTypes: string[];
  actorUserId: string;
}) {
  ensurePartnerWebhooksEnabled();
  const rawSecret = `whsec_${randomBytes(24).toString("hex")}`;
  const subscription = await prisma.webhookSubscription.create({
    data: {
      apiClientId: input.apiClientId,
      url: input.url,
      eventTypes: input.eventTypes,
      secretHash: hashApiKey(rawSecret),
      secretPrefix: rawSecret.slice(0, 16),
    },
  });
  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "developer_platform.webhook_subscription_created",
    entityType: "WebhookSubscription",
    entityId: subscription.id,
  });
  return {
    subscription,
    secret: rawSecret,
    message: "Store the webhook secret securely — it cannot be shown again.",
  };
}

export async function rotateWebhookSecret(
  subscriptionId: string,
  actorUserId: string,
) {
  ensurePartnerWebhooksEnabled();
  const rawSecret = `whsec_${randomBytes(24).toString("hex")}`;
  const gracePeriod = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const existing = await prisma.webhookSubscription.findUnique({
    where: { id: subscriptionId },
  });
  if (!existing) throw new Error("SUBSCRIPTION_NOT_FOUND");

  const updated = await prisma.webhookSubscription.update({
    where: { id: subscriptionId },
    data: {
      previousSecretHash: existing.secretHash,
      previousSecretExpiresAt: gracePeriod,
      secretHash: hashApiKey(rawSecret),
      secretPrefix: rawSecret.slice(0, 16),
      signingVersion: existing.signingVersion + 1,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "developer_platform.webhook_secret_rotated",
    entityType: "WebhookSubscription",
    entityId: subscriptionId,
  });

  return {
    subscription: updated,
    secret: rawSecret,
    previousSecretValidUntil: gracePeriod,
  };
}

export async function enqueueWebhookDelivery(input: {
  subscriptionId: string;
  eventType: string;
  payload: Record<string, unknown>;
  eventId?: string;
}) {
  ensurePartnerWebhooksEnabled();
  const eventId = input.eventId ?? `evt_${randomBytes(16).toString("hex")}`;
  const payloadStr = JSON.stringify(input.payload);
  const existing = await prisma.webhookDeliveryLog.findUnique({
    where: { eventId },
  });
  if (existing) {
    return { delivery: existing, replay: true };
  }

  const delivery = await prisma.webhookDeliveryLog.create({
    data: {
      subscriptionId: input.subscriptionId,
      eventId,
      eventType: input.eventType,
      payloadHash: hashPayload(payloadStr),
      timestampSent: new Date(),
      status: "pending",
      maxAttempts: developerPlatformConfig.webhookMaxAttempts,
      nextRetryAt: new Date(),
    },
  });

  return { delivery, replay: false };
}

export function buildWebhookHeaders(input: {
  secret: string;
  payload: string;
  eventId: string;
  eventType: string;
  signingVersion?: number;
}) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const version = input.signingVersion ?? 1;
  const signature = signWebhookPayload(
    input.secret,
    timestamp,
    input.payload,
    version,
  );
  return {
    "Content-Type": "application/json",
    "X-CareOS-Event-Id": input.eventId,
    "X-CareOS-Event-Type": input.eventType,
    "X-CareOS-Timestamp": timestamp,
    "X-CareOS-Signature-Version": String(version),
    "X-CareOS-Signature": signature,
  };
}

export async function markDeliveryAttempt(input: {
  deliveryId: string;
  success: boolean;
  responseStatus?: number;
  error?: string;
}) {
  const delivery = await prisma.webhookDeliveryLog.findUnique({
    where: { id: input.deliveryId },
  });
  if (!delivery) throw new Error("DELIVERY_NOT_FOUND");

  const attemptCount = delivery.attemptCount + 1;
  const maxAttempts = delivery.maxAttempts;

  if (input.success) {
    return prisma.webhookDeliveryLog.update({
      where: { id: input.deliveryId },
      data: {
        status: "delivered",
        attemptCount,
        responseStatus: input.responseStatus,
        lastError: null,
        nextRetryAt: null,
      },
    });
  }

  if (attemptCount >= maxAttempts) {
    return prisma.webhookDeliveryLog.update({
      where: { id: input.deliveryId },
      data: {
        status: "dead_letter",
        attemptCount,
        responseStatus: input.responseStatus,
        lastError: input.error,
        nextRetryAt: null,
      },
    });
  }

  const delayMs = computeRetryDelayMs(
    attemptCount,
    developerPlatformConfig.webhookRetryBaseMs,
  );

  return prisma.webhookDeliveryLog.update({
    where: { id: input.deliveryId },
    data: {
      status: "failed",
      attemptCount,
      responseStatus: input.responseStatus,
      lastError: input.error,
      nextRetryAt: new Date(Date.now() + delayMs),
    },
  });
}

export async function listPendingDeliveries(limit = 20) {
  return prisma.webhookDeliveryLog.findMany({
    where: {
      status: { in: ["pending", "failed"] },
      nextRetryAt: { lte: new Date() },
    },
    include: { subscription: true },
    orderBy: { nextRetryAt: "asc" },
    take: limit,
  });
}
