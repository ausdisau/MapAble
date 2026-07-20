/**
 * Assistive Technology Continuity (NDIS Expansion Wave 1).
 * Default off — not evidence of production readiness or clinical authority.
 */
export const atContinuityConfig = {
  get enabled() {
    return process.env.MAPABLE_AT_CONTINUITY_ENABLED === "true";
  },
  /** Permanent: MapAble is not clinical suitability / prescribing SoT. */
  clinicalSuitabilitySourceOfTruth: false as const,
  /** Permanent: not an emergency dispatch service. */
  emergencyDispatchEnabled: false as const,
};

export function isAtContinuityEnabled(): boolean {
  return atContinuityConfig.enabled;
}
