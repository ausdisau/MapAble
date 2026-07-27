function enabled(name: string, defaultOn = true) {
  const value = process.env[name];
  if (value === undefined) return defaultOn;
  return value === "true";
}

/**
 * Feature flags for CareOS top-ten opportunity MVPs.
 * Safety hard-offs remain false regardless of env.
 */
export const careosOpportunitiesConfig = {
  platformRegistrationEnabled: enabled(
    "MAPABLE_CAREOS_PLATFORM_REGISTRATION_ENABLED",
  ),
  consentWalletEnabled: enabled("MAPABLE_CAREOS_CONSENT_WALLET_ENABLED"),
  safetyGateEnabled: enabled("MAPABLE_CAREOS_SAFETY_GATE_ENABLED"),
  workforcePassportEnabled: enabled(
    "MAPABLE_CAREOS_WORKFORCE_PASSPORT_ENABLED",
  ),
  schemeCoordinationEnabled: enabled(
    "MAPABLE_CAREOS_SCHEME_COORDINATION_ENABLED",
  ),
  accessEvidenceGraphEnabled: enabled(
    "MAPABLE_CAREOS_ACCESS_EVIDENCE_GRAPH_ENABLED",
  ),
  thinMarketContinuityEnabled: enabled(
    "MAPABLE_CAREOS_THIN_MARKET_CONTINUITY_ENABLED",
  ),
  lifespanLiaisonEnabled: enabled("MAPABLE_CAREOS_LIFESPAN_LIAISON_ENABLED"),
  tenantIsolationEnforcementEnabled: enabled(
    "MAPABLE_CAREOS_TENANT_ISOLATION_ENABLED",
  ),
  /** Never enable automated claim submission via this pack. */
  automatedClaimSubmissionEnabled: false,
  /** Never auto-verify workforce competency. */
  autoVerifyCompetencyEnabled: false,
  /** Never compute participant risk / worthiness scores. */
  participantScoringEnabled: false,
} as const;

export type CareosOpportunitiesConfig = typeof careosOpportunitiesConfig;
