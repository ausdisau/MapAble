/**
 * CareOS capabilities default to disabled. A malformed value never enables a
 * capability, so deployment configuration cannot accidentally turn on AI.
 */
function enabled(name: string, defaultValue = false): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return value === "true";
}

export const careOSFeatureFlags = {
  aiEnabled: enabled("MAPABLE_AI_ENABLED"),
  enabled: enabled("MAPABLE_CAREOS_ENABLED"),
  coreEnabled: enabled("MAPABLE_CAREOS_CORE_ENABLED", true),
  careEnabled: enabled("MAPABLE_CAREOS_CARE_ENABLED", true),
  transportEnabled: enabled("MAPABLE_CAREOS_TRANSPORT_ENABLED", true),
  accessEnabled: enabled("MAPABLE_CAREOS_ACCESS_ENABLED", true),
  jobsEnabled: enabled("MAPABLE_CAREOS_JOBS_ENABLED"),
  movesEnabled: enabled("MAPABLE_CAREOS_MOVES_ENABLED"),
  foodsEnabled: enabled("MAPABLE_CAREOS_FOODS_ENABLED"),
  paymentsEnabled: enabled("MAPABLE_CAREOS_PAYMENTS_ENABLED"),
  writeActionsEnabled: enabled("MAPABLE_CAREOS_WRITE_ACTIONS"),
  memoryEnabled: enabled("MAPABLE_CAREOS_MEMORY_ENABLED"),
  continuityRadarEnabled: enabled("MAPABLE_CAREOS_CONTINUITY_RADAR_ENABLED"),
  auditEnabled: enabled("MAPABLE_CAREOS_AUDIT_ENABLED", true),
  model: process.env.MAPABLE_CAREOS_MODEL?.trim() || undefined,
} as const;

export type CareOSModule = keyof Pick<
  typeof careOSFeatureFlags,
  | "coreEnabled"
  | "careEnabled"
  | "transportEnabled"
  | "accessEnabled"
  | "jobsEnabled"
  | "movesEnabled"
  | "foodsEnabled"
  | "paymentsEnabled"
>;

export function isCareOSModuleEnabled(module: CareOSModule): boolean {
  return careOSFeatureFlags.enabled && careOSFeatureFlags[module];
}
