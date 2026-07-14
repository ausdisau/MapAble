function enabled(name: string) {
  return process.env[name] === "true";
}

/**
 * CareOS Phase 7 — Support Coordination OS feature flags.
 * All capabilities fail closed unless explicitly enabled.
 * AI may draft/suggest but MUST NOT determine funding, R&N, capacity, or force provider choice.
 */
export const supportCoordinationConfig = {
  enabled: enabled("MAPABLE_SUPPORT_COORDINATION_ENABLED"),
  enquiriesEnabled: enabled("MAPABLE_COORDINATION_ENQUIRIES_ENABLED"),
  evidencePacksEnabled: enabled("MAPABLE_COORDINATION_EVIDENCE_PACKS_ENABLED"),
  supervisionEnabled: enabled("MAPABLE_COORDINATION_SUPERVISION_ENABLED"),
  /** Safety: AI/human must never auto-determine funding decisions. */
  fundingDecisionEnabled: false,
  /** Safety: capacity determination remains human-led. */
  capacityDeterminationEnabled: false,
  /** Safety: provider selection is coordinator-guided, never forced. */
  automaticProviderSelectionEnabled: false,
} as const;

export type SupportCoordinationConfig = typeof supportCoordinationConfig;

export function ensureSupportCoordinationEnabled() {
  if (!supportCoordinationConfig.enabled) {
    throw new Error("SUPPORT_COORDINATION_DISABLED");
  }
}
