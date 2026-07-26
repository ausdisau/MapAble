import type { WorkerTrustCredential } from "@prisma/client";

export type IssuerPresentation = {
  credentialType: string;
  issuerDid: string;
  claims: Record<string, unknown>;
  expiresAt: Date;
};

export interface TrustPassportIssuerAdapter {
  issuePresentation(params: {
    workerProfileId: string;
    credentialType: string;
  }): Promise<IssuerPresentation>;
}

/** Mock issuer for pilot — not a production OID4VCI integration. */
export class MockIssuerAdapter implements TrustPassportIssuerAdapter {
  async issuePresentation(params: {
    workerProfileId: string;
    credentialType: string;
  }): Promise<IssuerPresentation> {
    const expiresAt = new Date(Date.now() + 365 * 86400000);
    const claims: Record<string, unknown> = {
      workerProfileId: params.workerProfileId,
      credentialType: params.credentialType,
      workerScreeningStatus: "verified",
      wwccStatus: "verified",
      firstAidStatus: "verified",
      insuranceStatus: "verified",
      verificationStatus: "verified",
    };

    return {
      credentialType: params.credentialType,
      issuerDid: "did:mock:mapable-pilot-issuer",
      claims,
      expiresAt,
    };
  }
}

export function getTrustPassportIssuerAdapter(): TrustPassportIssuerAdapter {
  return new MockIssuerAdapter();
}

export function mapClaimsToWorkerStatuses(
  claims: Record<string, unknown>
): Partial<{
  workerScreeningStatus: "verified";
  wwccStatus: "verified";
  firstAidStatus: "verified";
  insuranceStatus: "verified";
  verificationStatus: "verified";
}> {
  const out: Record<string, "verified"> = {};
  for (const key of [
    "workerScreeningStatus",
    "wwccStatus",
    "firstAidStatus",
    "insuranceStatus",
    "verificationStatus",
  ] as const) {
    if (claims[key] === "verified") out[key] = "verified";
  }
  return out;
}

export type { WorkerTrustCredential };
