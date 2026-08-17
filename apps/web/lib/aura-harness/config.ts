/** AURA harness feature flags and policy thresholds. */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/** Live getters so tests and runtime flag flips are respected. */
export const auraHarnessConfig = {
  get enabled(): boolean {
    return envFlag("MAPABLE_AURA_HARNESS_ENABLED", false);
  },
  get maxGamma(): number {
    return envNumber("MAPABLE_AURA_HARNESS_MAX_GAMMA", 75);
  },
  get maxConcentration(): number {
    return envNumber("MAPABLE_AURA_HARNESS_MAX_CONCENTRATION", 150);
  },
  get memoryTtlDays(): number {
    return envNumber("MAPABLE_AURA_HARNESS_MEMORY_TTL_DAYS", 60);
  },
};

export function isAuraHarnessEnabled(): boolean {
  return auraHarnessConfig.enabled;
}
