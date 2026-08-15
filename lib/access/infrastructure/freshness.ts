/**
 * Access Graph freshness / expiry evaluation (Epic 01).
 * Reuses feature-specific policies; stale/unknown never equals accessible.
 */

import {
  computeExpiryFromObservedAt,
  freshnessPolicyForConcept,
  type FreshnessPolicy,
  type FreshnessPolicyKey,
} from "@/lib/access/intelligence-next/evidence/freshness-policy";

export type FreshnessState = "fresh" | "stale" | "expired" | "unknown_age";

export type FreshnessEvaluation = {
  state: FreshnessState;
  policyKey: FreshnessPolicyKey;
  policyDescription: string;
  observedAt: string;
  expiresAt: string;
  ageHours: number | null;
  maxAgeHours: number;
  /** When true, display provenance must include expired/outdated labelling. */
  expired: boolean;
};

export function evaluateObservationFreshness(input: {
  ontologyConceptId: string;
  observedAt: Date | string;
  now?: Date;
  /** Optional override for reviewDue from the observation row. */
  reviewDue?: Date | string | null;
}): FreshnessEvaluation {
  const policy: FreshnessPolicy = freshnessPolicyForConcept(input.ontologyConceptId);
  const observedAt =
    typeof input.observedAt === "string"
      ? new Date(input.observedAt)
      : input.observedAt;
  const now = input.now ?? new Date();

  if (Number.isNaN(observedAt.getTime())) {
    return {
      state: "unknown_age",
      policyKey: policy.key,
      policyDescription: policy.description,
      observedAt: new Date(0).toISOString(),
      expiresAt: new Date(0).toISOString(),
      ageHours: null,
      maxAgeHours: policy.maxAgeHours,
      expired: true,
    };
  }

  const expiresAt = input.reviewDue
    ? typeof input.reviewDue === "string"
      ? new Date(input.reviewDue)
      : input.reviewDue
    : computeExpiryFromObservedAt(observedAt, policy);

  const ageMs = now.getTime() - observedAt.getTime();
  const ageHours = ageMs / (60 * 60 * 1000);
  const expired = now.getTime() >= expiresAt.getTime();

  let state: FreshnessState;
  if (expired) {
    state = "expired";
  } else if (ageHours >= policy.maxAgeHours * 0.8) {
    state = "stale";
  } else {
    state = "fresh";
  }

  return {
    state,
    policyKey: policy.key,
    policyDescription: policy.description,
    observedAt: observedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    ageHours: Math.round(ageHours * 100) / 100,
    maxAgeHours: policy.maxAgeHours,
    expired,
  };
}

export { computeExpiryFromObservedAt, freshnessPolicyForConcept };
