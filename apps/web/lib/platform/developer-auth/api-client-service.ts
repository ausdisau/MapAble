import { randomBytes } from "crypto";

import type { ApiClient, ApiScope } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { developerPlatformConfig, ensureDeveloperPlatformEnabled } from "@/lib/config/developer-platform";
import { prisma } from "@/lib/prisma";
import { hashApiKey } from "@/lib/stripe-billing/checkout-service";

export async function createApiClient(input: {
  name: string;
  organisationId?: string;
  developerAppId?: string;
  partnerSandboxAppId?: string;
  environment?: "sandbox" | "production";
  actorUserId?: string;
}) {
  ensureDeveloperPlatformEnabled();
  const client = await prisma.apiClient.create({
    data: {
      name: input.name,
      organisationId: input.organisationId,
      developerAppId: input.developerAppId,
      partnerSandboxAppId: input.partnerSandboxAppId,
      environment: input.environment ?? "sandbox",
      status: "draft",
    },
  });
  if (input.actorUserId) {
    await createAuditEvent({
      actorUserId: input.actorUserId,
      action: "developer_platform.client_created",
      entityType: "ApiClient",
      entityId: client.id,
    });
  }
  return client;
}

export async function activateApiClient(clientId: string, actorUserId: string) {
  ensureDeveloperPlatformEnabled();
  const client = await prisma.apiClient.update({
    where: { id: clientId },
    data: { status: "active" },
  });
  await createAuditEvent({
    actorUserId,
    action: "developer_platform.client_activated",
    entityType: "ApiClient",
    entityId: clientId,
  });
  return client;
}

export async function listApiClients(organisationId?: string) {
  return prisma.apiClient.findMany({
    where: organisationId ? { organisationId } : undefined,
    include: {
      apiKeys: { where: { revokedAt: null }, select: { id: true, keyPrefix: true, scopes: true, createdAt: true } },
      webhookSubscriptions: { where: { active: true }, select: { id: true, url: true, eventTypes: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function issueApiKey(
  clientId: string,
  scopes: ApiScope[],
  actorUserId?: string,
) {
  ensureDeveloperPlatformEnabled();
  const client = await prisma.apiClient.findUnique({ where: { id: clientId } });
  if (!client || client.status !== "active") {
    throw new Error("CLIENT_NOT_ACTIVE");
  }

  const raw = `cos_${randomBytes(24).toString("hex")}`;
  const keyHash = hashApiKey(raw);
  const keyPrefix = raw.slice(0, 14);

  const record = await prisma.platformApiKey.create({
    data: { clientId, keyHash, keyPrefix, scopes },
  });

  if (actorUserId) {
    await createAuditEvent({
      actorUserId,
      action: "developer_platform.api_key_issued",
      entityType: "ApiKey",
      entityId: record.id,
      metadata: { clientId, keyPrefix },
    });
  }

  return {
    apiKey: raw,
    keyPrefix,
    id: record.id,
    message: developerPlatformConfig.secretsShownOnce
      ? "Store this key securely — it cannot be shown again."
      : undefined,
  };
}

export async function revokeApiKey(keyId: string, actorUserId: string) {
  await prisma.platformApiKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() },
  });
  await createAuditEvent({
    actorUserId,
    action: "developer_platform.api_key_revoked",
    entityType: "ApiKey",
    entityId: keyId,
  });
}

export type ApiClientSummary = ApiClient;
