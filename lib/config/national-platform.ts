function enabled(name: string) {
  return process.env[name] === "true";
}

/**
 * CareOS Phase 15 — National Infrastructure, Federation and Resilience.
 * Multi-region hosting, federated identity, DR procedures, and platform observability.
 */
export const nationalPlatformConfig = {
  nationalPlatformEnabled: enabled("MAPABLE_NATIONAL_PLATFORM_ENABLED"),
  federationEnabled: enabled("MAPABLE_FEDERATION_ENABLED"),
  /** Federated identity must NOT auto-grant participant authority. */
  federatedIdentityGrantsParticipantAuthority: false,
  /** Failover claims require tested evidence — never assert untested failover works. */
  claimUntestedFailoverWorks: false,
  /** Target RPO in minutes (documented; not a runtime guarantee). */
  documentedRpoMinutes: Number(process.env.MAPABLE_DOCUMENTED_RPO_MINUTES ?? "15"),
  /** Target RTO in minutes (documented; not a runtime guarantee). */
  documentedRtoMinutes: Number(process.env.MAPABLE_DOCUMENTED_RTO_MINUTES ?? "60"),
  primaryRegion: process.env.MAPABLE_PRIMARY_REGION ?? "ap-southeast-2",
  drRegion: process.env.MAPABLE_DR_REGION ?? "ap-southeast-4",
} as const;

export type NationalPlatformConfig = typeof nationalPlatformConfig;

export function ensureNationalPlatformEnabled() {
  if (!nationalPlatformConfig.nationalPlatformEnabled) {
    throw new Error("NATIONAL_PLATFORM_DISABLED");
  }
}

export function ensureFederationEnabled() {
  if (!nationalPlatformConfig.federationEnabled) {
    throw new Error("FEDERATION_DISABLED");
  }
}

export function assertFederatedIdentityBoundary() {
  if (nationalPlatformConfig.federatedIdentityGrantsParticipantAuthority) {
    throw new Error("FEDERATED_IDENTITY_PARTICIPANT_AUTHORITY_FORBIDDEN");
  }
}

export function assertNoUntestedFailoverClaims() {
  if (nationalPlatformConfig.claimUntestedFailoverWorks) {
    throw new Error("UNTESTED_FAILOVER_CLAIM_FORBIDDEN");
  }
}
