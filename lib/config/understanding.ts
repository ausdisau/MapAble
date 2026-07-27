/** Understanding layer (CSNN) — flag-gated; default off. */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const understandingConfig = {
  get enabled(): boolean {
    return envFlag("MAPABLE_UNDERSTANDING_ENABLED", false);
  },
  maxSteps: Math.min(
    Math.max(Number(process.env.MAPABLE_UNDERSTANDING_MAX_STEPS ?? "6"), 1),
    12,
  ),
};

export function isUnderstandingEnabled(): boolean {
  return understandingConfig.enabled;
}
