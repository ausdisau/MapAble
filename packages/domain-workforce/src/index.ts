import { z } from "zod";

export const workforceEvidenceSchema = z.object({
  credentialType: z.string().min(1),
  verificationStatus: z.enum(["verified", "pending_review", "unverified", "revoked", "expired"]),
  expiresAt: z.string().datetime().nullable(),
  revokedAt: z.string().datetime().nullable(),
});

export function evaluateWorkforceEvidence(params: {
  evidence: z.infer<typeof workforceEvidenceSchema>[];
  requiredCredentialTypes: string[];
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const missing: string[] = [];
  for (const credentialType of params.requiredCredentialTypes) {
    const record = params.evidence.find((item) => item.credentialType === credentialType);
    if (!record) {
      missing.push(`CREDENTIAL_MISSING:${credentialType}`);
      continue;
    }
    if (record.verificationStatus !== "verified") {
      missing.push(`CREDENTIAL_UNVERIFIED:${credentialType}`);
      continue;
    }
    if (record.revokedAt || (record.expiresAt && new Date(record.expiresAt) <= now)) {
      missing.push(`CREDENTIAL_EXPIRED_OR_REVOKED:${credentialType}`);
    }
  }
  return { eligible: missing.length === 0, reasonCodes: missing };
}
