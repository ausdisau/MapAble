import { createHash } from "crypto";

import type { StripePaymentPurpose } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase5Config, integrationDisabledMessage } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";
import { buildLegacyInvoiceCheckout } from "@/lib/stripe/checkout";
import { isStripeIntegrationEnabled } from "@/lib/stripe/config";
import { ensureLegacyStripeCustomer } from "@/lib/stripe/customers";
import { legacyInvoiceMetadata } from "@/lib/stripe/metadata";

export function safeStripeMetadata(params: {
  invoiceId?: string;
  userId?: string;
  purpose: StripePaymentPurpose;
}) {
  return legacyInvoiceMetadata({
    invoiceId: params.invoiceId ?? "",
    userId: params.userId ?? "",
    purpose: params.purpose,
  });
}

export async function createCheckoutForInvoice(params: {
  invoiceId: string;
  amountCents: number;
  userId: string;
  purpose: StripePaymentPurpose;
}) {
  if (!phase5Config.stripeEnabled || !isStripeIntegrationEnabled()) {
    return { ok: false as const, ...integrationDisabledMessage("Stripe") };
  }

  const customerId = await ensureLegacyStripeCustomer(params.userId);

  const session = await buildLegacyInvoiceCheckout({
    invoiceId: params.invoiceId,
    userId: params.userId,
    amountCents: params.amountCents,
    purpose: params.purpose,
    customerId,
  });

  const record = await prisma.stripeCheckoutSessionRecord.create({
    data: {
      invoiceId: params.invoiceId,
      stripeSessionId: session.id,
      purpose: params.purpose,
      amountCents: params.amountCents,
      status: session.status ?? "open",
    },
  });

  await prisma.invoice.update({
    where: { id: params.invoiceId },
    data: { status: "stripe_payment_pending" },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "stripe.checkout_created",
    entityType: "Invoice",
    entityId: params.invoiceId,
  });

  return {
    ok: true as const,
    sessionId: session.id,
    record,
    metadata: safeStripeMetadata(params),
    url: session.url,
  };
}

export async function processStripeWebhookIdempotent(
  stripeEventId: string,
  eventType: string,
  payload: unknown
) {
  void stripeEventId;
  void eventType;
  const event = payload as import("stripe").Stripe.Event;
  const result = await import("@/lib/stripe/webhooks").then((m) =>
    m.processStripeWebhookEvent(event)
  );
  return { duplicate: result.duplicate };
}

export async function createRefundReview(
  paymentIntentId: string,
  amountCents: number,
  reason?: string
) {
  return prisma.stripeRefundRecord.create({
    data: {
      paymentIntentId,
      amountCents,
      status: "pending_review",
      reason,
    },
  });
}

export function hashApiKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}
