export {
  INTAKE_DOCUMENT_CLASSES,
  INTAKE_DOCUMENT_STATUSES,
  EXTRACTION_CONFIDENCE,
  CANDIDATE_STATUSES,
} from "./types";
export type {
  IntakeDocumentClass,
  IntakeDocumentStatus,
  ExtractionConfidence,
  CandidateStatus,
  IntakeDocument,
  ExtractionRun,
  ExtractionCandidate,
  IntakeReviewDecision,
  IntakeReview,
  IntakeProvenanceReceipt,
  CanonicalWriteResult,
} from "./types";
export {
  canTransitionIntakeStatus,
  assertIntakeTransition,
  isIntakeTerminal,
} from "./state-machine";
export {
  SYNTHETIC_INTAKE_FIXTURES,
  buildSyntheticIntakeDocument,
  runSyntheticExtraction,
  sourceTextLooksLikeInjection,
} from "./synthetic-adapter";
export type { SyntheticIntakeFixture } from "./synthetic-adapter";
export {
  createSyntheticIntakeSession,
  beginIntakeReview,
  applyIntakeReview,
  attemptApprovedCanonicalWrite,
} from "./workflow";
export type { IntakeSession } from "./workflow";
