import { createHash } from "crypto";

import type { ApiScope } from "@prisma/client";

import { jsonError } from "@/lib/api/response";
import { scopesAllow } from "@/lib/developer-api/api-key-service";
import type { EmploymentProviderScope } from "@/lib/employment-providers/des-iea";
import { prisma } from "@/lib/prisma";

export async function authenticateEmploymentProvider(req: Request) {
  const key = req.headers.get("x-api-key");
  if (!key) return null;
  const hash = createHash("sha256").update(key).digest("hex");
  const record = await prisma.developerApiKey.findFirst({
    where: { keyHash: hash, revokedAt: null },
    include: { app: true },
  });
  if (!record || record.app.status !== "approved") return null;
  return record;
}

export function requireEmploymentConsentHeader(req: Request): Response | null {
  const consentRef = req.headers.get("x-mapable-consent-ref")?.trim();
  if (!consentRef) {
    return jsonError(
      "Participant consent required. Provide x-mapable-consent-ref for DES/IEA data access.",
      403,
    );
  }
  return null;
}

export function requireEmploymentScope(
  scopes: ApiScope[],
  needed: EmploymentProviderScope,
): Response | null {
  if (!scopesAllow(scopes, needed as ApiScope)) {
    return jsonError(`Forbidden scope: ${needed}`, 403);
  }
  return null;
}
