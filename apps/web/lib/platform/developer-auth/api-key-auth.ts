import type { ApiClient, ApiScope } from "@prisma/client";

import { scopesAllow } from "@/lib/developer-api/api-key-service";
import { prisma } from "@/lib/prisma";
import { hashApiKey } from "@/lib/stripe-billing/checkout-service";

export type AuthenticatedApiContext = {
  client: ApiClient;
  scopes: ApiScope[];
  apiKeyId?: string;
  serviceAccountId?: string;
  isServiceAccount: boolean;
};

export async function authenticateApiKey(
  req: Request,
): Promise<AuthenticatedApiContext | null> {
  const key = req.headers.get("x-api-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!key) return null;

  const hash = hashApiKey(key);
  const record = await prisma.platformApiKey.findFirst({
    where: { keyHash: hash, revokedAt: null },
    include: { client: true },
  });
  if (!record || record.client.status === "revoked" || record.client.status === "suspended") {
    return null;
  }

  await prisma.platformApiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    client: record.client,
    scopes: record.scopes,
    apiKeyId: record.id,
    isServiceAccount: false,
  };
}

export function scopeAllows(granted: ApiScope[], required: ApiScope) {
  return scopesAllow(granted, required);
}
