/**
 * Explicit personal usability conclusion states.
 * Never reduce consequential answers to a bare boolean.
 */
export type AccessConclusionState =
  | "compatible"
  | "incompatible"
  | "likely_compatible"
  | "cannot_confirm"
  | "stale"
  | "disputed"
  | "temporarily_unavailable"
  | "operational_status_unknown"
  | "requires_confirmation"
  | "requires_human_assistance"
  | "blocked_by_hard_requirement"
  | "fallback_available"
  | "fallback_unverified"
  | "participant_goal_not_yet_verified";

export const ACCESS_CONCLUSION_STATES: AccessConclusionState[] = [
  "compatible",
  "incompatible",
  "likely_compatible",
  "cannot_confirm",
  "stale",
  "disputed",
  "temporarily_unavailable",
  "operational_status_unknown",
  "requires_confirmation",
  "requires_human_assistance",
  "blocked_by_hard_requirement",
  "fallback_available",
  "fallback_unverified",
  "participant_goal_not_yet_verified",
];
