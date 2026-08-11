/**
 * Access Infrastructure feature flags.
 * All default off. Permanent deny flags live in intelligence-next.
 */

function envTruthy(key: string): boolean {
  const v = process.env[key];
  return v === "1" || v === "true" || v === "yes";
}

export const accessInfrastructureFlags = {
  get enabled() {
    return envTruthy("MAPABLE_ACCESS_INFRASTRUCTURE_ENABLED");
  },
  get passport() {
    return envTruthy("MAPABLE_ACCESS_PASSPORT_ENABLED");
  },
  get compatibilityEngine() {
    return envTruthy("MAPABLE_ACCESS_COMPATIBILITY_ENGINE_ENABLED");
  },
  get journeyEngine() {
    return envTruthy("MAPABLE_ACCESS_JOURNEY_ENGINE_ENABLED");
  },
};
