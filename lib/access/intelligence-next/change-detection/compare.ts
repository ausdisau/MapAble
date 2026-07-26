import { getHarbourGraph } from "../graph/harbour-fixture";

import type {
  AccessChangeCandidate,
  AccessChangeOutcome,
  AccessChangeReview,
} from "./types";

function valuesEqual(
  a: string | number | boolean | null,
  b: string | number | boolean | null,
): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

/**
 * Compare a new observation candidate with the Living Access Twin projection.
 * Never auto-overwrites verified evidence — always creates a review object.
 */
export function detectAccessChange(candidate: AccessChangeCandidate): AccessChangeReview {
  const graph = getHarbourGraph();
  const node = graph.nodes.find((n) => n.id === candidate.subjectNodeId);
  const now = new Date().toISOString();

  if (!node) {
    return buildReview(candidate, "cannot_compare", "Node not found in Twin", now, [
      "Cannot compare — subject missing from synthetic graph",
    ]);
  }

  if (candidate.evidenceClass === "model_candidate" || candidate.evidenceClass === "device_assisted_estimate") {
    // Vision / model candidates always require human review
    const propKey = conceptToProperty(candidate.ontologyConceptId);
    const existing = propKey ? (node.properties[propKey] ?? null) : null;
    if (existing == null && candidate.candidateValue != null) {
      return buildReview(
        candidate,
        "new_candidate",
        `No existing value for ${candidate.ontologyConceptId}`,
        now,
        ["Model candidate is not verified evidence", "Human review required before any Twin update"],
      );
    }
    if (!valuesEqual(existing, candidate.candidateValue)) {
      return buildReview(
        candidate,
        "human_review_required",
        `Existing ${String(existing)} vs candidate ${String(candidate.candidateValue)}`,
        now,
        ["Provisional measurement must not overwrite verified evidence"],
      );
    }
    return buildReview(
      candidate,
      "matches_existing",
      "Candidate matches existing Twin value",
      now,
      ["Still not an automatic publish"],
    );
  }

  if (node.temporalState === "stale" || node.temporalState === "expired") {
    return buildReview(
      candidate,
      "source_stale",
      "Twin node temporal state is stale/expired",
      now,
      ["Refresh baseline before accepting change"],
    );
  }

  const propKey = conceptToProperty(candidate.ontologyConceptId);
  const existing = propKey ? (node.properties[propKey] ?? null) : null;

  if (existing == null && candidate.candidateValue != null) {
    return buildReview(
      candidate,
      "new_candidate",
      `New observation for ${candidate.ontologyConceptId}`,
      now,
      ["Create review — do not auto-write"],
    );
  }

  if (valuesEqual(existing, candidate.candidateValue)) {
    return buildReview(candidate, "matches_existing", "Matches existing Twin value", now, []);
  }

  // Temporary obstruction heuristic
  if (
    candidate.method.includes("temporary") ||
    candidate.expiryAt != null
  ) {
    return buildReview(
      candidate,
      "temporary_change",
      `Possible temporary change: ${String(existing)} → ${String(candidate.candidateValue)}`,
      now,
      ["Temporary changes expire; do not replace durable geometry"],
    );
  }

  if (
    node.evidenceClass === "independently_verified_claim" ||
    node.evidenceClass === "professional_measurement" ||
    node.evidenceClass === "manual_measurement"
  ) {
    return buildReview(
      candidate,
      "conflicts_with_existing",
      `Conflicts with verified Twin value ${String(existing)}`,
      now,
      ["Verified evidence cannot be overwritten automatically"],
    );
  }

  return buildReview(
    candidate,
    "possible_change",
    `Possible change: ${String(existing)} → ${String(candidate.candidateValue)}`,
    now,
    ["Human review required"],
  );
}

function conceptToProperty(conceptId: string): string | null {
  switch (conceptId) {
    case "physical.minimum_clear_width_mm":
      return "clear_width_mm";
    case "physical.step_free":
      return "step_free";
    case "physical.lift_operational":
      return "lift_operational";
    case "physical.accessible_toilet":
      return "accessible_toilet";
    case "physical.revolving_door":
      return "revolving_door";
    case "physical.staff_dependent_entrance":
      return "staff_dependent";
    default:
      return null;
  }
}

function buildReview(
  candidate: AccessChangeCandidate,
  outcome: AccessChangeOutcome,
  newCandidateSummary: string,
  createdAt: string,
  notes: string[],
): AccessChangeReview {
  return {
    reviewId: `review:${candidate.candidateId}`,
    candidate,
    outcome,
    oldStateSummary: `Twin node ${candidate.subjectNodeId} / ${candidate.ontologyConceptId}`,
    newCandidateSummary,
    reviewer: null,
    decision: outcome === "matches_existing" ? "pending" : "pending",
    createdAt,
    decidedAt: null,
    notes,
    autoOverwriteBlocked: true,
  };
}

/** In-memory shadow store for change reviews (not durable). */
const shadowReviews = new Map<string, AccessChangeReview>();

export function storeShadowChangeReview(review: AccessChangeReview): AccessChangeReview {
  shadowReviews.set(review.reviewId, review);
  return review;
}

export function listShadowChangeReviews(): AccessChangeReview[] {
  return [...shadowReviews.values()];
}

export function clearShadowChangeReviews(): void {
  shadowReviews.clear();
}
