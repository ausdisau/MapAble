/**
 * CareOS Phase 15 — Federation identity contracts.
 * Federated identity does NOT auto-grant participant authority.
 */

export type FederationIdentityProtocol = "oidc" | "saml";

export interface FederatedIdentityClaims {
  sub: string;
  email?: string;
  name?: string;
  orgId?: string;
  roles?: string[];
  issuer: string;
}

export interface FederationTrustRecord {
  id: string;
  partnerName: string;
  protocol: FederationIdentityProtocol;
  issuerUrl: string;
  status: "pending" | "active" | "suspended" | "revoked";
  participantAuthorityBlocked: boolean;
}

export interface OrgDirectoryEntry {
  id: string;
  regionCode: string;
  displayName: string;
  directoryRef?: string;
  organisationId?: string;
}

export interface TrustedServiceAccountBinding {
  serviceAccountId: string;
  federationTrustId: string;
  scopes: string[];
  participantAuthorityBlocked: true;
}

export interface PartnerApiClientBinding {
  apiClientId: string;
  federationTrustId: string;
  environment: "sandbox" | "production";
}

export interface RegionalOrgAdapter {
  regionCode: string;
  resolveOrganisation: (directoryRef: string) => Promise<OrgDirectoryEntry | null>;
}

export interface FederationSessionContext {
  trustId: string;
  federatedUserId: string;
  /** Always false — federated login never grants participant authority. */
  participantAuthorityGranted: false;
  scopes: string[];
}
