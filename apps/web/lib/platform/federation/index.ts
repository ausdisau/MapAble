export type {
  FederatedIdentityClaims,
  FederationIdentityProtocol,
  FederationSessionContext,
  FederationTrustRecord,
  OrgDirectoryEntry,
  PartnerApiClientBinding,
  RegionalOrgAdapter,
  TrustedServiceAccountBinding,
} from "@/lib/platform/federation/contracts";
export {
  checkFederatedParticipantAuthority,
  establishFederationSession,
  listFederationTrusts,
  listRegionalOrganisations,
  resolveActiveFederationTrust,
} from "@/lib/platform/federation/federation-service";
export {
  createRegionalOrgAdapter,
  listSupportedRegions,
  resolveOrgAcrossRegions,
} from "@/lib/platform/federation/regional-org-adapter";
