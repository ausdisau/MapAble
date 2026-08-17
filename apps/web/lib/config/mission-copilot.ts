function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const missionCopilotConfig = {
  get enabled() {
    return envFlag("MAPABLE_MISSION_COPILOT_ENABLED", false);
  },
  get modelGenerationEnabled() {
    return envFlag("MAPABLE_MISSION_COPILOT_MODEL_ENABLED", false);
  },
  authorityCeiling: "READ_ONLY_EXPLAIN" as const,
};
