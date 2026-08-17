function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const caseCopilotConfig = {
  get enabled() {
    return envFlag("MAPABLE_CASE_COPILOT_ENABLED", false);
  },
  authorityCeiling: "DRAFT_ONLY" as const,
};
