/**
 * Thriving Kids Foundational Triage — feature flag.
 * Default off; enable only with explicit === "true".
 */
export function isThrivingKidsTriageEnabled(): boolean {
  return process.env.MAPABLE_THRIVING_KIDS_TRIAGE_ENABLED === "true";
}
