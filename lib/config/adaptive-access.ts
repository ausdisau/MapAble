/** Adaptive Access Runtime flags. All default false — presentation only, no LLM. */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const adaptiveAccessConfig = {
  get runtimeEnabled() {
    return envFlag("MAPABLE_ADAPT_RUNTIME_ENABLED", false);
  },
  get accessProfileEnabled() {
    return envFlag("MAPABLE_ACCESS_PROFILE_ENABLED", false);
  },
  get familiarInterfaceEnabled() {
    return envFlag("MAPABLE_FAMILIAR_INTERFACE_ENABLED", false);
  },
  get easyReadPresentationEnabled() {
    return envFlag("MAPABLE_EASY_READ_PRESENTATION_ENABLED", false);
  },
  /** Presentation only — never legal/financial/clinical authority. */
  authorityCeiling: "PRESENTATION_ONLY" as const,
  productionClaimStatus: "not_claimable" as const,
  maturity: "contract_only" as const,
};
