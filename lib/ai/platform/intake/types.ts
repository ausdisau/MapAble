/**
 * Review-first evidence intake contracts.
 * Extracted values never write directly to canonical domain records.
 */

export const INTAKE_DOCUMENT_CLASSES = [
  "ndis_plan",
  "service_agreement",
  "provider_quote",
  "invoice",
  "support_plan",
  "assistive_technology_report",
  "maintenance_record",
  "accessibility_statement",
  "floor_plan",
  "employment_document",
  "appointment_letter",
  "discharge_document",
  "complaints_correspondence",
  "incident_evidence",
  "unknown",
] as const;

export type IntakeDocumentClass = (typeof INTAKE_DOCUMENT_CLASSES)[number];

export const INTAKE_DOCUMENT_STATUSES = [
  "uploaded",
  "validated",
  "scan_pending",
  "scan_failed",
  "extracting",
  "candidates_ready",
  "in_review",
  "corrected",
  "approved_pending_write",
  "write_refused",
  "rejected",
  "expired",
] as const;

export type IntakeDocumentStatus = (typeof INTAKE_DOCUMENT_STATUSES)[number];

export const EXTRACTION_CONFIDENCE = [
  "high",
  "medium",
  "low",
  "unknown",
] as const;

export type ExtractionConfidence = (typeof EXTRACTION_CONFIDENCE)[number];

export const CANDIDATE_STATUSES = [
  "proposed",
  "accepted",
  "corrected",
  "rejected",
  "unresolved",
] as const;

export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export type IntakeDocument = {
  id: string;
  tenantId: string;
  participantScopeId: string | null;
  uploaderId: string;
  purpose: string;
  documentClass: IntakeDocumentClass;
  status: IntakeDocumentStatus;
  contentHash: string;
  mimeType: string;
  sizeBytes: number;
  /** Reference into existing Document / lib/storage — not a parallel blob store. */
  encryptedStorageRef: string;
  retentionUntilIso: string | null;
  consentBasis: string;
  createdAtIso: string;
  updatedAtIso: string;
};

export type ExtractionRun = {
  id: string;
  intakeDocumentId: string;
  provider: string;
  model: string | null;
  parserVersion: string;
  promptVersion: string | null;
  startedAtIso: string;
  completedAtIso: string | null;
  failureReason: string | null;
  tokenCount: number | null;
  estimatedCostUsd: number | null;
  /** Telemetry must never include raw participant content. */
  synthetic: boolean;
};

export type ExtractionCandidate = {
  id: string;
  extractionRunId: string;
  fieldKey: string;
  candidateValue: string;
  sourcePage: number | null;
  boundingRegion: string | null;
  extractionMethod: "synthetic_fixture" | "rules" | "model" | "human";
  confidence: ExtractionConfidence;
  sourceText: string;
  status: CandidateStatus;
  correction: string | null;
  plainLanguageExplanation: string;
};

export type IntakeReviewDecision = {
  candidateId: string;
  accepted: boolean;
  correctedValue: string | null;
  rejected: boolean;
  unresolved: boolean;
  canonicalTarget: string | null;
};

export type IntakeReview = {
  id: string;
  intakeDocumentId: string;
  reviewerId: string;
  authority: string;
  decisions: IntakeReviewDecision[];
  reviewedAtIso: string;
};

export type IntakeProvenanceReceipt = {
  id: string;
  intakeDocumentId: string;
  extractionRunId: string | null;
  reviewId: string | null;
  capabilityKey: string;
  authorityCeiling: "DRAFT_ONLY";
  sourceVersion: string;
  evidenceFreshnessIso: string;
  unknowns: string[];
  conflicts: string[];
  humanReviewState: string;
  participantCorrectionRights: true;
  canonicalWriteAttempted: boolean;
  canonicalWriteAllowed: boolean;
  createdAtIso: string;
};

export type CanonicalWriteResult =
  | {
      ok: true;
      writeReceiptId: string;
    }
  | {
      ok: false;
      reason:
        | "intake_disabled"
        | "canonical_write_disabled"
        | "review_incomplete"
        | "authority_exceeded";
      message: string;
    };
