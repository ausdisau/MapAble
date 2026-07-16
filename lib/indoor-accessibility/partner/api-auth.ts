import { createHash, timingSafeEqual } from "crypto";

import { isIndoorFeatureEnabled } from "@/lib/indoor-accessibility/feature-flags";
import { indoorApiError } from "@/lib/indoor-accessibility/api-errors";
import { prisma } from "@/lib/prisma";

export function hashPartnerApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function authenticatePartnerRequest(
  request: Request,
): Promise<{ clientId: string; scopes: string[] } | Response> {
  if (!isIndoorFeatureEnabled("partnerApi")) {
    return indoorApiError("INDOOR_FEATURE_DISABLED", "Partner API is not enabled.", 403);
  }

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return indoorApiError("UNAUTHORIZED", "API key required.", 401);
  }

  const apiKey = auth.slice(7);
  const keyHash = hashPartnerApiKey(apiKey);

  const credential = await prisma.partnerApiClient.findFirst({
    where: { keyHash, active: true },
  });

  if (!credential) {
    return indoorApiError("UNAUTHORIZED", "Invalid API key.", 401);
  }

  if (credential.expiresAt && credential.expiresAt < new Date()) {
    return indoorApiError("UNAUTHORIZED", "API key expired.", 401);
  }

  const scopes = credential.scopes;

  await prisma.partnerApiClient.update({
    where: { id: credential.id },
    data: { lastUsedAt: new Date() },
  });

  return { clientId: credential.id, scopes };
}

export function requirePartnerScope(
  scopes: string[],
  required: string,
): boolean {
  return scopes.includes(required) || scopes.includes("*");
}

/** Constant-time compare for webhook signatures. */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHash("sha256").update(`${secret}.${payload}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
