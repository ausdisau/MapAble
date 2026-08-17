/**
 * Participant-facing AccessCast forecast states.
 * Never display solely by colour — always pair with label + reason text.
 */

export type AccessCastForecastState =
  | "stable"
  | "likely_usable"
  | "fragile"
  | "degraded"
  | "temporarily_unavailable"
  | "cannot_confirm"
  | "conflicting"
  | "stale"
  | "unknown";

export const ACCESSCAST_FORECAST_STATES: AccessCastForecastState[] = [
  "stable",
  "likely_usable",
  "fragile",
  "degraded",
  "temporarily_unavailable",
  "cannot_confirm",
  "conflicting",
  "stale",
  "unknown",
];

/** Lower index = worse for journey rollup. */
export const ACCESSCAST_STATE_SEVERITY: Record<AccessCastForecastState, number> = {
  temporarily_unavailable: 0,
  conflicting: 1,
  cannot_confirm: 2,
  stale: 3,
  fragile: 4,
  degraded: 5,
  likely_usable: 6,
  stable: 7,
  unknown: 8,
};

export const ACCESSCAST_STATE_LABELS: Record<AccessCastForecastState, string> = {
  stable: "Stable",
  likely_usable: "Likely usable",
  fragile: "Fragile",
  degraded: "Degraded",
  temporarily_unavailable: "Temporarily unavailable",
  cannot_confirm: "Cannot confirm",
  conflicting: "Conflicting",
  stale: "Stale",
  unknown: "Unknown",
};

export const ACCESSCAST_STATE_DEFINITIONS: Record<AccessCastForecastState, string> = {
  stable:
    "All known hard requirements are supported by sufficiently current evidence, with no identified active disruptions.",
  likely_usable:
    "Evidence supports the journey, but one or more non-critical uncertainties remain.",
  fragile:
    "The journey currently depends on one or more single points of failure without a verified fallback.",
  degraded:
    "The journey remains possible but involves additional burden, delay, distance, assistance or workaround.",
  temporarily_unavailable: "A known current condition blocks a hard requirement.",
  cannot_confirm: "Required evidence or service confirmation is missing.",
  conflicting: "Current sources disagree.",
  stale: "The relevant evidence has exceeded its feature-specific freshness period.",
  unknown: "Insufficient information exists to evaluate the journey.",
};

export function rollupForecastState(
  states: AccessCastForecastState[],
): AccessCastForecastState {
  if (states.length === 0) return "unknown";
  let worst: AccessCastForecastState = states[0]!;
  for (const s of states) {
    if (ACCESSCAST_STATE_SEVERITY[s] < ACCESSCAST_STATE_SEVERITY[worst]) {
      worst = s;
    }
  }
  return worst;
}

/** Map Access Intelligence Next conclusion vocabulary → AccessCast forecast state. */
export function mapConclusionToForecastState(
  conclusion: string,
  opts?: {
    hasSpofWithoutFallback?: boolean;
    hasStaleCritical?: boolean;
    hasConflict?: boolean;
    hasFailedHard?: boolean;
    hasUnresolvedHard?: boolean;
  },
): AccessCastForecastState {
  if (opts?.hasFailedHard || conclusion === "blocked_by_hard_requirement") {
    return "temporarily_unavailable";
  }
  if (opts?.hasConflict || conclusion === "disputed") {
    return "conflicting";
  }
  if (opts?.hasStaleCritical || conclusion === "stale") {
    return "stale";
  }
  if (opts?.hasUnresolvedHard || conclusion === "cannot_confirm") {
    return "cannot_confirm";
  }
  if (
    opts?.hasSpofWithoutFallback ||
    conclusion === "fallback_unverified" ||
    conclusion === "requires_confirmation"
  ) {
    return "fragile";
  }
  if (conclusion === "temporarily_unavailable") {
    return "temporarily_unavailable";
  }
  if (conclusion === "operational_status_unknown") {
    return "cannot_confirm";
  }
  if (conclusion === "likely_compatible") {
    return "likely_usable";
  }
  if (conclusion === "compatible" || conclusion === "fallback_available") {
    return "stable";
  }
  if (conclusion === "incompatible") {
    return "temporarily_unavailable";
  }
  if (conclusion === "requires_human_assistance") {
    return "degraded";
  }
  return "unknown";
}
