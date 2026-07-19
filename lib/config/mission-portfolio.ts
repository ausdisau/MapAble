function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const missionPortfolioConfig = {
  get enabled() {
    return envFlag("MAPABLE_MISSION_PORTFOLIO_ENABLED", false);
  },
  get serviceStandardEnabled() {
    return envFlag("MAPABLE_SERVICE_STANDARD_ENABLED", false);
  },
  get whatChangedEnabled() {
    return envFlag("MAPABLE_WHAT_CHANGED_ENABLED", false);
  },
};
