function enabled(name: string, defaultOn = false) {
  const value = process.env[name];
  if (value === undefined) return defaultOn;
  return value === "true";
}

/**
 * Feature flags for CareOS top-ten opportunity MVPs.
 * Defaults fail-closed (off) for production; enable explicitly via env.
 * Safety hard-offs remain false regardless of env.
 * Env is read via getters so tests can toggle process.env per case.
 */
export const careosOpportunitiesConfig = {
  get platformRegistrationEnabled() {
    return enabled("MAPABLE_CAREOS_PLATFORM_REGISTRATION_ENABLED");
  },
  get consentWalletEnabled() {
    return enabled("MAPABLE_CAREOS_CONSENT_WALLET_ENABLED");
  },
  get safetyGateEnabled() {
    return enabled("MAPABLE_CAREOS_SAFETY_GATE_ENABLED");
  },
  get workforcePassportEnabled() {
    return enabled("MAPABLE_CAREOS_WORKFORCE_PASSPORT_ENABLED");
  },
  get schemeCoordinationEnabled() {
    return enabled("MAPABLE_CAREOS_SCHEME_COORDINATION_ENABLED");
  },
  get accessEvidenceGraphEnabled() {
    return enabled("MAPABLE_CAREOS_ACCESS_EVIDENCE_GRAPH_ENABLED");
  },
  get thinMarketContinuityEnabled() {
    return enabled("MAPABLE_CAREOS_THIN_MARKET_CONTINUITY_ENABLED");
  },
  get lifespanLiaisonEnabled() {
    return enabled("MAPABLE_CAREOS_LIFESPAN_LIAISON_ENABLED");
  },
  get tenantIsolationEnforcementEnabled() {
    return enabled("MAPABLE_CAREOS_TENANT_ISOLATION_ENABLED");
  },
  /** Never enable automated claim submission via this pack. */
  get automatedClaimSubmissionEnabled() {
    return false;
  },
  /** Never auto-verify workforce competency. */
  get autoVerifyCompetencyEnabled() {
    return false;
  },
  /** Never compute participant risk / worthiness scores. */
  get participantScoringEnabled() {
    return false;
  },
} as const;

export type CareosOpportunitiesConfig = typeof careosOpportunitiesConfig;
