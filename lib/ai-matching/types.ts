/** Separated matching truth — never flatten into a fake model score. */

export type MatchEvidenceFreshness = "fresh" | "stale" | "unknown";

export type CandidateAcceptanceErrorCode =
  | "NOT_FOUND"
  | "ALREADY_ACCEPTED"
  | "ALREADY_TERMINAL"
  | "EXPIRED"
  | "FAIRNESS_REVIEW_MISSING"
  | "FAIRNESS_REVIEW_REJECTED"
  | "FAIRNESS_REVIEW_NOT_APPROVED"
  | "CARE_REQUEST_MISMATCH"
  | "CANDIDATE_OWNERSHIP_MISMATCH"
  | "CROSS_TENANT"
  | "INVALID_STATE"
  | "CONCURRENT_ACCEPTANCE";

export class AiMatchingError extends Error {
  readonly code: CandidateAcceptanceErrorCode;

  constructor(code: CandidateAcceptanceErrorCode, message?: string) {
    super(message ?? code);
    this.name = "AiMatchingError";
    this.code = code;
  }
}

export type ParticipantMatchExplanation = {
  whyMayWork: string;
  confirmed: string[];
  unknown: string[];
  needsChecking: string[];
  whoMustConfirm: string;
  modelRan: boolean;
  note: string;
};

export type MatchScoreBreakdown = {
  eligibilityOk: boolean;
  hardRequirementsMet: boolean;
  preferenceAlignment: number | null;
  availabilityKnown: boolean;
  evidenceFreshness: MatchEvidenceFreshness;
  unknownFields: string[];
  deterministicRuleScore: number;
  modelCommentaryScore: number | null;
  modelRunId: string | null;
  modelVersion: string | null;
  combinedDisplayScore: number;
  lowConfidence: boolean;
};
