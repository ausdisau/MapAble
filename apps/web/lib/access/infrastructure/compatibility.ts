import type { AccessConclusionState } from "@/lib/access/intelligence-next/results/states";

import type { AccessCompatibilityState } from "./domains";

/**
 * Map proof-carrying conclusion states → four-state product compatibility.
 * Unknown / stale / disputed never collapse to compatible or incompatible alone.
 */
export function mapConclusionToCompatibility(
  conclusion: AccessConclusionState,
): AccessCompatibilityState {
  switch (conclusion) {
    case "compatible":
    case "likely_compatible":
      return "compatible";
    case "fallback_available":
    case "requires_human_assistance":
      return "compatible_with_adjustment";
    case "incompatible":
    case "blocked_by_hard_requirement":
      return "incompatible";
    case "cannot_confirm":
    case "stale":
    case "disputed":
    case "temporarily_unavailable":
    case "operational_status_unknown":
    case "requires_confirmation":
    case "fallback_unverified":
    case "participant_goal_not_yet_verified":
      return "uncertain";
    default: {
      const _exhaustive: never = conclusion;
      return _exhaustive;
    }
  }
}

export function isDecisiveCompatibility(state: AccessCompatibilityState): boolean {
  return state === "compatible" || state === "incompatible";
}
