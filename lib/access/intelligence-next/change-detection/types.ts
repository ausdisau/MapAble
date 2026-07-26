import type { AccessEvidenceClass } from "../evidence/classes";

export type AccessChangeOutcome =
  | "matches_existing"
  | "possible_change"
  | "new_candidate"
  | "temporary_change"
  | "conflicts_with_existing"
  | "source_stale"
  | "cannot_compare"
  | "human_review_required";

export type AccessChangeCandidate = {
  candidateId: string;
  subjectNodeId: string;
  ontologyConceptId: string;
  previousValue: string | number | boolean | null;
  candidateValue: string | number | boolean | null;
  source: string;
  method: string;
  evidenceClass: AccessEvidenceClass;
  observedAt: string;
  confidenceDimensions: {
    geometric?: "low" | "medium" | "high";
    semantic?: "low" | "medium" | "high";
    temporal?: "low" | "medium" | "high";
  };
  affectedRouteIds: string[];
  potentialPublicImpact: "none" | "local" | "journey" | "public_map";
  expiryAt: string | null;
};

export type AccessChangeReviewDecision =
  | "pending"
  | "accepted_as_temporary"
  | "accepted_as_update"
  | "rejected"
  | "needs_more_evidence"
  | "escalated";

export type AccessChangeReview = {
  reviewId: string;
  candidate: AccessChangeCandidate;
  outcome: AccessChangeOutcome;
  oldStateSummary: string;
  newCandidateSummary: string;
  reviewer: string | null;
  decision: AccessChangeReviewDecision;
  createdAt: string;
  decidedAt: string | null;
  notes: string[];
  /** Verified evidence must never be overwritten automatically. */
  autoOverwriteBlocked: true;
};
