import { aiIntakeConfig } from "@/lib/config/ai-intake";

import { assertIntakeTransition } from "./state-machine";
import {
  buildSyntheticIntakeDocument,
  runSyntheticExtraction,
  sourceTextLooksLikeInjection,
  SYNTHETIC_INTAKE_FIXTURES,
} from "./synthetic-adapter";
import type {
  CanonicalWriteResult,
  ExtractionCandidate,
  ExtractionRun,
  IntakeDocument,
  IntakeProvenanceReceipt,
  IntakeReview,
  IntakeReviewDecision,
} from "./types";

export type IntakeSession = {
  document: IntakeDocument;
  run: ExtractionRun | null;
  candidates: ExtractionCandidate[];
  review: IntakeReview | null;
  receipt: IntakeProvenanceReceipt | null;
};

function transition(
  document: IntakeDocument,
  to: IntakeDocument["status"],
  nowIso: string
): IntakeDocument {
  assertIntakeTransition(document.status, to);
  return { ...document, status: to, updatedAtIso: nowIso };
}

/**
 * Synthetic end-to-end intake path for tests and pilots.
 * Never calls live OCR. Canonical writes are refused while the write flag is false.
 */
export function createSyntheticIntakeSession(input: {
  documentId: string;
  runId: string;
  fixtureKey: keyof typeof SYNTHETIC_INTAKE_FIXTURES;
  tenantId: string;
  participantScopeId: string | null;
  uploaderId: string;
  purpose: string;
  consentBasis: string;
  storageRef: string;
  nowIso?: string;
}): IntakeSession {
  if (!aiIntakeConfig.enabled) {
    throw new Error("MAPABLE_AI_INTAKE_ENABLED is false");
  }
  const now = input.nowIso ?? new Date().toISOString();
  let document = buildSyntheticIntakeDocument({
    id: input.documentId,
    fixtureKey: input.fixtureKey,
    tenantId: input.tenantId,
    participantScopeId: input.participantScopeId,
    uploaderId: input.uploaderId,
    purpose: input.purpose,
    consentBasis: input.consentBasis,
    storageRef: input.storageRef,
    nowIso: now,
  });
  document = transition(document, "validated", now);
  document = transition(document, "scan_pending", now);
  document = transition(document, "extracting", now);
  const { run, candidates } = runSyntheticExtraction({
    runId: input.runId,
    intakeDocumentId: document.id,
    fixtureKey: input.fixtureKey,
    nowIso: now,
  });
  document = transition(document, "candidates_ready", now);
  return { document, run, candidates, review: null, receipt: null };
}

export function beginIntakeReview(
  session: IntakeSession,
  nowIso?: string
): IntakeSession {
  const now = nowIso ?? new Date().toISOString();
  return {
    ...session,
    document: transition(session.document, "in_review", now),
  };
}

export function applyIntakeReview(input: {
  session: IntakeSession;
  reviewId: string;
  reviewerId: string;
  authority: string;
  decisions: IntakeReviewDecision[];
  nowIso?: string;
}): IntakeSession {
  const now = input.nowIso ?? new Date().toISOString();
  const candidates = input.session.candidates.map((candidate) => {
    const decision = input.decisions.find((d) => d.candidateId === candidate.id);
    if (!decision) return candidate;
    if (decision.rejected) {
      return { ...candidate, status: "rejected" as const, correction: null };
    }
    if (decision.unresolved) {
      return { ...candidate, status: "unresolved" as const };
    }
    if (decision.correctedValue != null) {
      return {
        ...candidate,
        status: "corrected" as const,
        correction: decision.correctedValue,
      };
    }
    if (decision.accepted) {
      return { ...candidate, status: "accepted" as const };
    }
    return candidate;
  });

  const hasCorrection = candidates.some((c) => c.status === "corrected");
  const allResolved = candidates.every(
    (c) => c.status === "accepted" || c.status === "corrected" || c.status === "rejected"
  );

  let document = input.session.document;
  if (hasCorrection && document.status === "in_review") {
    document = transition(document, "corrected", now);
  }
  if (allResolved) {
    if (document.status === "corrected" || document.status === "in_review") {
      document = transition(document, "approved_pending_write", now);
    }
  }

  const review: IntakeReview = {
    id: input.reviewId,
    intakeDocumentId: document.id,
    reviewerId: input.reviewerId,
    authority: input.authority,
    decisions: input.decisions,
    reviewedAtIso: now,
  };

  return { ...input.session, document, candidates, review };
}

/**
 * Approved write stub — refuses unless MAPABLE_AI_INTAKE_CANONICAL_WRITE_ENABLED.
 * Never elevates above DRAFT_ONLY without an explicit domain service (future wave).
 */
export function attemptApprovedCanonicalWrite(input: {
  session: IntakeSession;
  receiptId: string;
  nowIso?: string;
}): { session: IntakeSession; result: CanonicalWriteResult } {
  const now = input.nowIso ?? new Date().toISOString();
  const session = input.session;

  if (!aiIntakeConfig.enabled) {
    return {
      session,
      result: {
        ok: false,
        reason: "intake_disabled",
        message: "MAPABLE_AI_INTAKE_ENABLED is false",
      },
    };
  }

  if (aiIntakeConfig.authorityCeiling !== "DRAFT_ONLY") {
    return {
      session,
      result: {
        ok: false,
        reason: "authority_exceeded",
        message: "Intake authority ceiling is DRAFT_ONLY",
      },
    };
  }

  if (!session.review || session.document.status !== "approved_pending_write") {
    return {
      session,
      result: {
        ok: false,
        reason: "review_incomplete",
        message: "Review must complete before any write attempt",
      },
    };
  }

  const injectionConflicts = session.candidates
    .filter((c) => sourceTextLooksLikeInjection(c.sourceText))
    .map((c) => `injection_pattern:${c.fieldKey}`);

  const writeAllowed = aiIntakeConfig.canonicalWriteEnabled;
  const receipt: IntakeProvenanceReceipt = {
    id: input.receiptId,
    intakeDocumentId: session.document.id,
    extractionRunId: session.run?.id ?? null,
    reviewId: session.review.id,
    capabilityKey: "intake.field_extract",
    authorityCeiling: "DRAFT_ONLY",
    sourceVersion: session.run?.parserVersion ?? "unknown",
    evidenceFreshnessIso: now,
    unknowns: session.candidates
      .filter((c) => c.confidence === "unknown" || c.status === "unresolved")
      .map((c) => c.fieldKey),
    conflicts: injectionConflicts,
    humanReviewState: writeAllowed ? "approved" : "write_refused",
    participantCorrectionRights: true,
    canonicalWriteAttempted: true,
    canonicalWriteAllowed: writeAllowed,
    createdAtIso: now,
  };

  if (!writeAllowed) {
    const refused = transition(session.document, "write_refused", now);
    return {
      session: { ...session, document: refused, receipt },
      result: {
        ok: false,
        reason: "canonical_write_disabled",
        message:
          "MAPABLE_AI_INTAKE_CANONICAL_WRITE_ENABLED is false — extracted values stay as candidates only",
      },
    };
  }

  return {
    session: { ...session, receipt },
    result: {
      ok: true,
      writeReceiptId: receipt.id,
    },
  };
}
