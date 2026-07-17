import type { AccessEvidenceClass } from "@/lib/access-intelligence-next";

import {
  ACCESSCAST_STATE_SEVERITY,
  type AccessCastForecastState,
  rollupForecastState,
} from "./states";
import type {
  AccessCastCondition,
  AccessCastFallback,
  AccessCastRequirement,
  AccessCastSegment,
} from "./types";

/**
 * Deterministic AccessCast state rules.
 * A language model must not calculate the authoritative state.
 */

export function evidenceClassMayIndependentlyBlock(cls: AccessEvidenceClass): boolean {
  switch (cls) {
    case "model_candidate":
    case "device_assisted_estimate":
    case "synthetic_fixture":
      return false;
    case "participant_observation":
    case "community_observation":
    case "venue_declaration":
    case "mapper_observation":
    case "manual_measurement":
    case "professional_measurement":
    case "operational_sensor":
    case "authoritative_public_source":
    case "moderated_claim":
    case "independently_verified_claim":
      return true;
    default: {
      const _exhaustive: never = cls;
      return _exhaustive;
    }
  }
}

export type AccessCastRuleInputs = {
  requirements: AccessCastRequirement[];
  conditions: AccessCastCondition[];
  segments: AccessCastSegment[];
  fallback: AccessCastFallback | null;
  offlineExpired?: boolean;
};

/**
 * Apply deterministic forecast rules and return the authoritative state.
 */
export function calculateForecastState(inputs: AccessCastRuleInputs): AccessCastForecastState {
  const { requirements, conditions, segments, fallback, offlineExpired } = inputs;

  if (offlineExpired) {
    return "stale";
  }

  const failedHard = requirements.filter((r) => r.hard && r.status === "failed");
  const unresolvedHard = requirements.filter((r) => r.hard && r.status === "unresolved");
  const staleCritical = segments.some((s) => s.freshness === "stale" && s.hardRequirementEffect !== "none");
  const conflicts = conditions.filter((c) => c.kind === "conflict");

  // Model candidates cannot independently create temporarily_unavailable
  const blockingConditions = conditions.filter(
    (c) =>
      c.independentlyBlocks &&
      evidenceClassMayIndependentlyBlock(c.evidenceClass) &&
      (c.kind === "incident" || c.kind === "construction"),
  );

  if (failedHard.length > 0 || blockingConditions.some((c) => c.kind === "incident")) {
    // One failed hard requirement blocks likely_usable / stable
    return "temporarily_unavailable";
  }

  if (conflicts.length > 0) {
    return "conflicting";
  }

  if (staleCritical) {
    // Stale critical evidence returns stale or cannot_confirm — prefer stale when freshness exceeded
    return "stale";
  }

  if (unresolvedHard.length > 0) {
    // Unknown hard requirement returns cannot_confirm
    return "cannot_confirm";
  }

  const spofWithoutFallback = segments.some(
    (s) => s.singlePointOfFailure && (!s.fallback || !s.fallback.verified),
  );
  if (spofWithoutFallback || (fallback && !fallback.verified && segments.some((s) => s.singlePointOfFailure))) {
    return "fragile";
  }

  const degraded = segments.some((s) => s.currentState === "degraded") ||
    conditions.some((c) => c.kind === "environmental_advisory");
  if (degraded) {
    return "degraded";
  }

  const softUncertainty = requirements.some((r) => !r.hard && r.status === "unresolved");
  if (softUncertainty) {
    return "likely_usable";
  }

  const segmentRollup = rollupForecastState(segments.map((s) => s.currentState));
  if (ACCESSCAST_STATE_SEVERITY[segmentRollup] <= ACCESSCAST_STATE_SEVERITY.fragile) {
    return segmentRollup;
  }

  if (segments.length === 0 && requirements.length === 0) {
    return "unknown";
  }

  return "stable";
}

/** Failed hard requirements cannot return stable or likely_usable. */
export function assertStateConsistentWithHardFailures(
  state: AccessCastForecastState,
  requirements: AccessCastRequirement[],
): boolean {
  const failedHard = requirements.some((r) => r.hard && r.status === "failed");
  if (!failedHard) return true;
  return state !== "stable" && state !== "likely_usable";
}

/** Unknown hard requirements cannot return stable. */
export function assertUnknownHardNotStable(
  state: AccessCastForecastState,
  requirements: AccessCastRequirement[],
): boolean {
  const unresolvedHard = requirements.some((r) => r.hard && r.status === "unresolved");
  if (!unresolvedHard) return true;
  return state !== "stable";
}

/** Model candidate conditions must not independently yield temporarily_unavailable. */
export function modelCandidateCannotIndependentlyBlock(
  conditions: AccessCastCondition[],
  state: AccessCastForecastState,
): boolean {
  const onlyModelBlockers = conditions.filter((c) => c.kind === "model_candidate");
  const hasIndependentBlocker = conditions.some(
    (c) =>
      c.independentlyBlocks &&
      c.kind !== "model_candidate" &&
      evidenceClassMayIndependentlyBlock(c.evidenceClass),
  );
  if (onlyModelBlockers.length > 0 && !hasIndependentBlocker && state === "temporarily_unavailable") {
    return false;
  }
  return true;
}
