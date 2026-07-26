import { randomBytes } from "crypto";

import type { ApiScope } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";
import { hashApiKey } from "@/lib/stripe/legacy-checkout-service";

export async function createDeveloperApp(
  developerOrganisationId: string,
  name: string
) {
  if (!phase5Config.developerApiEnabled) {
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
