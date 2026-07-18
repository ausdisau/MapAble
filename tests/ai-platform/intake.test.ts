import { afterEach, describe, expect, it } from "vitest";

import {
  applyIntakeReview,
  attemptApprovedCanonicalWrite,
  beginIntakeReview,
  canTransitionIntakeStatus,
  createSyntheticIntakeSession,
  requireAiCapability,
  sourceTextLooksLikeInjection,
} from "@/lib/ai-platform";

describe("AI Evidence Intake Studio", () => {
  afterEach(() => {
    delete process.env.MAPABLE_AI_INTAKE_ENABLED;
    delete process.env.MAPABLE_AI_INTAKE_CANONICAL_WRITE_ENABLED;
  });

  it("registers intake capabilities as DRAFT_ONLY synthetic", () => {
    const classify = requireAiCapability("intake.document_classify");
    const extract = requireAiCapability("intake.field_extract");
    expect(classify.authorityCeiling).toBe("DRAFT_ONLY");
    expect(extract.authorityCeiling).toBe("DRAFT_ONLY");
    expect(classify.maturity).toBe("synthetic_only");
    expect(extract.humanReviewRequired).toBe(true);
    expect(extract.productionClaimStatus).toBe("not_claimable");
  });

  it("allows valid status transitions and rejects invalid ones", () => {
    expect(canTransitionIntakeStatus("uploaded", "validated")).toBe(true);
    expect(canTransitionIntakeStatus("uploaded", "approved_pending_write")).toBe(
      false
    );
  });

  it("refuses session creation when intake flag is off", () => {
    expect(() =>
      createSyntheticIntakeSession({
        documentId: "doc-1",
        runId: "run-1",
        fixtureKey: "service_agreement_basic",
        tenantId: "org-1",
        participantScopeId: "p-1",
        uploaderId: "u-1",
        purpose: "agreement_review",
        consentBasis: "participant_upload",
        storageRef: "doc://synthetic/service-agreement",
      })
    ).toThrow(/MAPABLE_AI_INTAKE_ENABLED/);
  });

  it("produces candidates and refuses canonical write while write flag is false", () => {
    process.env.MAPABLE_AI_INTAKE_ENABLED = "true";
    let session = createSyntheticIntakeSession({
      documentId: "doc-1",
      runId: "run-1",
      fixtureKey: "service_agreement_basic",
      tenantId: "org-1",
      participantScopeId: "p-1",
      uploaderId: "u-1",
      purpose: "agreement_review",
      consentBasis: "participant_upload",
      storageRef: "doc://synthetic/service-agreement",
      nowIso: "2026-07-18T00:00:00.000Z",
    });
    expect(session.document.status).toBe("candidates_ready");
    expect(session.candidates.length).toBeGreaterThan(0);
    expect(session.run?.synthetic).toBe(true);

    session = beginIntakeReview(session, "2026-07-18T00:01:00.000Z");
    session = applyIntakeReview({
      session,
      reviewId: "rev-1",
      reviewerId: "reviewer-1",
      authority: "participant",
      decisions: session.candidates.map((c) => ({
        candidateId: c.id,
        accepted: true,
        correctedValue: null,
        rejected: false,
        unresolved: false,
        canonicalTarget: null,
      })),
      nowIso: "2026-07-18T00:02:00.000Z",
    });
    expect(session.document.status).toBe("approved_pending_write");

    const { session: afterWrite, result } = attemptApprovedCanonicalWrite({
      session,
      receiptId: "receipt-1",
      nowIso: "2026-07-18T00:03:00.000Z",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("canonical_write_disabled");
    }
    expect(afterWrite.document.status).toBe("write_refused");
    expect(afterWrite.receipt?.canonicalWriteAllowed).toBe(false);
    expect(afterWrite.receipt?.participantCorrectionRights).toBe(true);
    expect(afterWrite.receipt?.authorityCeiling).toBe("DRAFT_ONLY");
  });

  it("flags prompt-injection patterns inside invoice source text", () => {
    process.env.MAPABLE_AI_INTAKE_ENABLED = "true";
    const session = createSyntheticIntakeSession({
      documentId: "doc-2",
      runId: "run-2",
      fixtureKey: "invoice_with_injection",
      tenantId: "org-1",
      participantScopeId: "p-1",
      uploaderId: "u-1",
      purpose: "invoice_review",
      consentBasis: "participant_upload",
      storageRef: "doc://synthetic/invoice",
    });
    const injected = session.candidates.find((c) =>
      sourceTextLooksLikeInjection(c.sourceText)
    );
    expect(injected).toBeDefined();

    const reviewed = applyIntakeReview({
      session: beginIntakeReview(session),
      reviewId: "rev-2",
      reviewerId: "reviewer-1",
      authority: "coordinator",
      decisions: session.candidates.map((c) => ({
        candidateId: c.id,
        accepted: true,
        correctedValue: null,
        rejected: false,
        unresolved: false,
        canonicalTarget: null,
      })),
    });
    const { session: after } = attemptApprovedCanonicalWrite({
      session: reviewed,
      receiptId: "receipt-2",
    });
    expect(
      after.receipt?.conflicts.some((c) => c.startsWith("injection_pattern:"))
    ).toBe(true);
  });
});
