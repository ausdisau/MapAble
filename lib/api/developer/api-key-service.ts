import { randomBytes } from "crypto";

import type { ApiScope } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { developerPlatformConfig } from "@/lib/config/developer-platform";
import { phase5Config } from "@/lib/config/phase5";
import {
  createApiClient,
  issueApiKey as issuePlatformApiKey,
} from "@/lib/platform/developer-auth/api-client-service";
import { prisma } from "@/lib/prisma";
import { hashApiKey } from "@/lib/stripe/legacy-checkout-service";

export async function createDeveloperApp(
  developerOrganisationId: string,
  name: string
) {
  if (!phase5Config.developerApiEnabled && !developerPlatformConfig.enabled) {
    throw new Error("DEVELOPER_API_DISABLED");
  }
  return prisma.developerApp.create({
    data: { developerOrganisationId, name, status: "draft" },
  });
}

export async function approveDeveloperApp(appId: string, adminUserId: string) {
  const app = await prisma.developerApp.update({
    where: { id: appId },
    data: { status: "approved" },
  });
  await createAuditEvent({
    actorUserId: adminUserId,
    action: "developer_app.approved",
    entityType: "DeveloperApp",
    entityId: appId,
  });
  return app;
}

export async function generateApiKey(appId: string, scopes: ApiScope[]) {
  const app = await prisma.developerApp.findUnique({ where: { id: appId } });
  if (!app || app.status !== "approved") throw new Error("APP_NOT_APPROVED");

  const raw = `mk_${randomBytes(24).toString("hex")}`;
  const keyHash = hashApiKey(raw);
  const keyPrefix = raw.slice(0, 12);

  await prisma.developerApiKey.create({
    data: { appId, keyHash, keyPrefix, scopes },
  });

  return { apiKey: raw, keyPrefix, message: "Store this key securely — it cannot be shown again." };
}

/** Bridge legacy DeveloperApp to Phase 12 ApiClient + platform key. */
export async function provisionPlatformClientFromDeveloperApp(
  appId: string,
  actorUserId: string,
) {
  const app = await prisma.developerApp.findUnique({
    where: { id: appId },
    include: { developerOrganisation: true },
  });
  if (!app || app.status !== "approved") throw new Error("APP_NOT_APPROVED");

  const existing = await prisma.apiClient.findFirst({
    where: { developerAppId: appId },
  });
  if (existing) return existing;

  const client = await createApiClient({
    name: app.name,
    developerAppId: appId,
    environment: "sandbox",
    actorUserId,
  });
  await prisma.apiClient.update({
    where: { id: client.id },
    data: { status: "active" },
  });
  return client;
}

export async function generatePlatformApiKey(
  clientId: string,
  scopes: ApiScope[],
  actorUserId?: string,
) {
  return issuePlatformApiKey(clientId, scopes, actorUserId);
}

export function scopesAllow(
  granted: ApiScope[],
  required: ApiScope
) {
  return granted.includes(required);
}

export async function logApiUsage(params: {
  appId: string;
  path: string;
  method: string;
  status: number;
}) {
  await prisma.apiUsageLog.create({ data: params });
}
