import { z } from "zod";

export const workforceEvidenceSchema = z.object({
  credentialType: z.string().min(1),
  verificationStatus: z.enum(["verified", "pending_review", "unverified", "revoked", "expired"]),
  expiresAt: z.string().datetime().nullable(),
  revokedAt: z.string().datetime().nullable(),
});

export type WorkforceEvidenceRecord = z.infer<typeof workforceEvidenceSchema>;

function isExpiredOrRevoked(record: WorkforceEvidenceRecord, now: Date): boolean {
  if (record.revokedAt) return true;
  if (record.verificationStatus === "revoked" || record.verificationStatus === "expired") {
    return true;
  }
  return Boolean(record.expiresAt && new Date(record.expiresAt) <= now);
}

/**
 * Deterministic pick per credential type:
 * 1. current verified, non-expired, non-revoked
 * 2. pending / unverified that is not expired or revoked
 * 3. expired or revoked (never outranks a valid record)
 * Missing evidence stays missing — callers treat it as unknown/blocked.
 */
export function selectBestEvidenceForType(
  evidence: WorkforceEvidenceRecord[],
  credentialType: string,
  now: Date,
): WorkforceEvidenceRecord | undefined {
  const ofType = evidence.filter((item) => item.credentialType === credentialType);
  if (ofType.length === 0) return undefined;

  const rank = (record: WorkforceEvidenceRecord): number => {
    const dead = isExpiredOrRevoked(record, now);
    if (record.verificationStatus === "verified" && !dead) return 3;
    if (!dead) return 2;
    return 1;
  };

  return [...ofType].sort((a, b) => {
    const rankDiff = rank(b) - rank(a);
    if (rankDiff !== 0) return rankDiff;
    const expA = a.expiresAt ? new Date(a.expiresAt).getTime() : Number.POSITIVE_INFINITY;
    const expB = b.expiresAt ? new Date(b.expiresAt).getTime() : Number.POSITIVE_INFINITY;
    return expB - expA;
  })[0];
}

export function evaluateWorkforceEvidence(params: {
  evidence: WorkforceEvidenceRecord[];
  requiredCredentialTypes: string[];
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const missing: string[] = [];
  for (const credentialType of params.requiredCredentialTypes) {
    const record = selectBestEvidenceForType(params.evidence, credentialType, now);
    if (!record) {
      missing.push(`CREDENTIAL_MISSING:${credentialType}`);
      continue;
    }
    if (isExpiredOrRevoked(record, now)) {
      missing.push(`CREDENTIAL_EXPIRED_OR_REVOKED:${credentialType}`);
      continue;
    }
    if (record.verificationStatus !== "verified") {
      missing.push(`CREDENTIAL_UNVERIFIED:${credentialType}`);
    }
  }
  return { eligible: missing.length === 0, reasonCodes: missing };
}
