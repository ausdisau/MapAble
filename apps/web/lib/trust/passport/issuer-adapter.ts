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

/** Mock issuer for pilot — not a production OID4VCI integration and not clearance. */
export class MockIssuerAdapter implements TrustPassportIssuerAdapter {
  async issuePresentation(params: {
    workerProfileId: string;
    credentialType: string;
  }): Promise<IssuerPresentation> {
    const expiresAt = new Date(Date.now() + 365 * 86400000);
    const claims: Record<string, unknown> = {
      workerProfileId: params.workerProfileId,
      credentialType: params.credentialType,
      workerScreeningStatus: "mock_unverified",
      wwccStatus: "not_independently_verified",
      firstAidStatus: "not_independently_verified",
      insuranceStatus: "not_independently_verified",
      verificationStatus: "mock_unverified",
      independentlyVerified: false,
      mockIssuer: true,
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

/**
 * Mock and unverified claims must never promote WorkerProfile screening,
 * WWCC, first-aid, insurance, or verification fields.
 */
export function mapClaimsToWorkerStatuses(
  _claims: Record<string, unknown>,
): Partial<{
  workerScreeningStatus: "verified";
  wwccStatus: "verified";
  firstAidStatus: "verified";
  insuranceStatus: "verified";
  verificationStatus: "verified";
}> {
  return {};
}

export type { WorkerTrustCredential };
