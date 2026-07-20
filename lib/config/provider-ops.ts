/**
 * Provider Operations Centre — read-only attention projection.
 * Defaults false. No rankings, auto-escalation, or second operational writer.
 */
export const providerOpsConfig = {
  get enabled() {
    return process.env.MAPABLE_PROVIDER_OPS_ENABLED === "true";
  },
  authorityCeiling: "READ_ONLY_ATTENTION" as const,
  productionClaimStatus: "not_claimable" as const,
  maturity: "controlled_pilot" as const,
  autoEscalation: false as const,
  providerRanking: false as const,
};

export function isProviderOpsEnabled(): boolean {
  return providerOpsConfig.enabled;
}
