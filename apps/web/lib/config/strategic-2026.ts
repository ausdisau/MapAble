/**
 * Feature flags for Strategic 2026 expansion scaffolds.
 * All default off — enable only with explicit === "true".
 */

export function isPlatformShieldEnabled(): boolean {
  return process.env.MAPABLE_PLATFORM_SHIELD_ENABLED === "true";
}

export function isFoundationalSupportsEnabled(): boolean {
  return process.env.MAPABLE_FOUNDATIONAL_SUPPORTS_ENABLED === "true";
}

export function isPaceQuarterlyPacingEnabled(): boolean {
  return process.env.MAPABLE_PACE_QUARTERLY_PACING_ENABLED === "true";
}

export function isBehavioralRiskEnabled(): boolean {
  return process.env.MAPABLE_BEHAVIORAL_RISK_ENABLED === "true";
}

export function isVirtualCareHubEnabled(): boolean {
  return process.env.MAPABLE_VIRTUAL_CARE_HUB_ENABLED === "true";
}
