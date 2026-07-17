import { beforeEach, describe, expect, it, vi } from "vitest";

const envelopeCreate = vi.hoisted(() => vi.fn());
const reviewUpsert = vi.hoisted(() => vi.fn());
const reviewFind = vi.hoisted(() => vi.fn());
const reviewUpdate = vi.hoisted(() => vi.fn());
const envelopeUpdate = vi.hoisted(() => vi.fn());
const placeFind = vi.hoisted(() => vi.fn());
const auditMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    accessEvidenceEnvelopeRecord: {
      create: envelopeCreate,
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: envelopeUpdate,
    },
    accessChangeReviewRecord: {
      upsert: reviewUpsert,
      findUnique: reviewFind,
      update: reviewUpdate,
      findMany: vi.fn(),
    },
    accessPlace: {
      findUnique: placeFind,
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: auditMock,
}));

import {
  detectAccessChange,
  freshnessPolicyForConcept,
  persistChangeReview,
  persistEvidenceObservation,
  decideChangeReview,
  HARBOUR_PILOT,
} from "@/lib/access-intelligence-next";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.MAPABLE_ACCESS_INTELLIGENCE_NEXT_ENABLED = "true";
  process.env.MAPABLE_ACCESS_EVIDENCE_PERSISTENCE_ENABLED = "true";
  envelopeCreate.mockResolvedValue({
    id: "env-row-1",
    envelopeId: "env:1",
  });
  reviewUpsert.mockResolvedValue({
    id: "rev-row-1",
    reviewId: "review:cand-1",
  });
  auditMock.mockResolvedValue(undefined);
});

describe("feature-specific freshness", () => {
  it("uses short TTL for lift status and long TTL for door width", () => {
    expect(freshnessPolicyForConcept("physical.lift_operational").maxAgeHours).toBe(24);
    expect(
      freshnessPolicyForConcept("physical.minimum_clear_width_mm").maxAgeHours,
    ).toBeGreaterThan(24 * 30);
  });
});

describe("persistent evidence envelope", () => {
  it("persists observation without auto-publish and preserves conflicts", async () => {
    const result = await persistEvidenceObservation({
      subjectCanonicalRef: HARBOUR_PILOT.venueCanonicalRef,
      subjectNodeId: HARBOUR_PILOT.liftNodeId,
      ontologyConceptId: "physical.lift_operational",
      evidenceClass: "venue_declaration",
      source: "harbour_venue_portal",
      summary: "Lift A unavailable until 16:00",
      conflictWithEvidenceIds: ["ev:prior"],
      conflictNote: "Disagreement preserved",
      createdById: "venue-staff-1",
    });

    expect(result.autoPublished).toBe(false);
    expect(result.productionClaim).toBe("none");
    expect(result.conflictState).toBe("conflict_preserved");
    expect(result.envelope.conflicts).toHaveLength(1);
    expect(result.freshnessPolicyKey).toBe("lift_status");
    expect(envelopeCreate).toHaveBeenCalled();
  });

  it("marks model candidates unverified", async () => {
    const result = await persistEvidenceObservation({
      subjectCanonicalRef: HARBOUR_PILOT.venueCanonicalRef,
      subjectNodeId: HARBOUR_PILOT.entranceNodeId,
      ontologyConceptId: "physical.minimum_clear_width_mm",
      evidenceClass: "model_candidate",
      source: "vision_access_shadow",
      summary: "Model candidate door width",
    });
    expect(result.verificationStatus).toBe("candidate_unverified");
  });
});

describe("human change review", () => {
  it("persists review with autoOverwriteBlocked", async () => {
    const review = detectAccessChange({
      candidateId: "cand-1",
      subjectNodeId: HARBOUR_PILOT.liftNodeId,
      ontologyConceptId: "physical.lift_operational",
      previousValue: true,
      candidateValue: false,
      source: "venue",
      method: "venue_declaration",
      evidenceClass: "venue_declaration",
      observedAt: new Date().toISOString(),
      confidenceDimensions: { temporal: "high" },
      affectedRouteIds: ["harbour_starting_work"],
      potentialPublicImpact: "journey",
      expiryAt: new Date(Date.now() + 3600_000).toISOString(),
    });

    const persisted = await persistChangeReview({
      review,
      evidenceEnvelopeRecordId: "env-row-1",
      subjectCanonicalRef: HARBOUR_PILOT.venueCanonicalRef,
    });

    expect(persisted.autoPublished).toBe(false);
    expect(review.autoOverwriteBlocked).toBe(true);
    expect(reviewUpsert).toHaveBeenCalled();
  });

  it("human accept does not publish to AccessPlace", async () => {
    reviewFind.mockResolvedValue({
      id: "rev-row-1",
      reviewId: "review:cand-1",
      decision: "pending",
      notesJson: [],
      evidenceEnvelopeId: "env-row-1",
    });
    reviewUpdate.mockResolvedValue({});
    envelopeUpdate.mockResolvedValue({});

    const result = await decideChangeReview({
      reviewId: "review:cand-1",
      reviewerId: "mapper-1",
      decision: "accepted_as_temporary",
      note: "Confirmed with venue staff",
    });

    expect(result.publishedToAccessPlace).toBe(false);
    expect(envelopeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { verificationStatus: "human_reviewed_candidate" },
      }),
    );
  });
});
