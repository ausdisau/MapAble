/**
 * Native Companion foundation flags.
 * Defaults false — no App Store production claim; web remains the essential pathway.
 */
export const companionConfig = {
  get enabled() {
    return process.env.MAPABLE_COMPANION_ENABLED === "true";
  },
  get visitPackEnabled() {
    return process.env.MAPABLE_COMPANION_VISIT_PACK_ENABLED === "true";
  },
  authorityCeiling: "DEVICE_LOCAL_AND_FLAGGED_COMPILE" as const,
  productionClaimStatus: "not_claimable" as const,
  maturity: "controlled_pilot" as const,
};

export function isCompanionEnabled(): boolean {
  return companionConfig.enabled;
}

export function isCompanionVisitPackEnabled(): boolean {
  return companionConfig.enabled && companionConfig.visitPackEnabled;
}
