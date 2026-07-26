import { createHash, randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

import { isPartnerApiKeyScopeId } from "./partner-api-key-scopes";

const KEY_PREFIX_ROOT = "mapable_live_";

export type CreatePartnerApiKeyInput = {
  partnerId: string;
  name: string;
  scopes: string[];
  expiresAt?: Date | null;
};

export type CreatePartnerApiKeyResult = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  expiresAt: Date | null;
  createdAt: Date;
  /** Plain-text key — returned once; never stored. */
  apiKey: string;
  message: string;
};

export function hashPartnerProgramApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Generates a cryptographically secure 32-byte API key.
 * Stores only the SHA-256 hash; returns the plain-text key once.
 */
export async function createPartnerApiKey(
  input: CreatePartnerApiKeyInput
): Promise<CreatePartnerApiKeyResult> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("API_KEY_NAME_REQUIRED");
  }
  if (!input.partnerId) {
    throw new Error("API_KEY_PARTNER_REQUIRED");
  }

  const scopes = dedupeScopes(input.scopes);
  if (scopes.length === 0) {
    throw new Error("API_KEY_SCOPES_REQUIRED");
  }
  for (const scope of scopes) {
    if (!isPartnerApiKeyScopeId(scope)) {
      throw new Error("API_KEY_SCOPE_INVALID");
    }
  }

  const secret = randomBytes(32).toString("hex");
  const apiKey = `${KEY_PREFIX_ROOT}${secret}`;
  const prefix = `${KEY_PREFIX_ROOT}${secret.slice(0, 8)}…`;
  const keyHash = hashPartnerProgramApiKey(apiKey);

  const record = await prisma.apiKey.create({
    data: {
      partnerId: input.partnerId,
      name,
      keyHash,
      prefix,
      scopes,
      expiresAt: input.expiresAt ?? null,
    },
  });

  return {
    id: record.id,
    name: record.name,
    prefix: record.prefix,
    scopes: record.scopes,
    expiresAt: record.expiresAt,
    createdAt: record.createdAt,
    apiKey,
    message:
      "Store this API key securely. It will never be shown again.",
  };
}

export async function listPartnerApiKeys(partnerIds: string[]) {
  if (partnerIds.length === 0) return [];

  return prisma.apiKey.findMany({
    where: {
      partnerId: { in: partnerIds },
      revokedAt: null,
    },
    select: {
      id: true,
      partnerId: true,
      name: true,
      prefix: true,
      scopes: true,
      expiresAt: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

function dedupeScopes(scopes: string[]): string[] {
  return [...new Set(scopes.map((scope) => scope.trim()).filter(Boolean))];
}
