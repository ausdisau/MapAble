import { afterEach, describe, expect, it } from "vitest";

import {
  clearShadowChangeReviews,
  detectAccessChange,
  evaluateTemporalAccess,
  fuseTemporalOverlay,
  type AccessChangeCandidate,
  type AccessEvidenceReference,
} from "@/lib/access-intelligence-next";

afterEach(() => {
  clearShadowChangeReviews();
});

const baseEvidence = (observedAt: string): AccessEvidenceReference => ({
  evidenceId: "ev-1",
  class: "manual_measurement",
  ontologyConceptId: "physical.minimum_clear_width_mm",
  source: "fixture",
  observedAt,
  summary: "Door width",
  limitations: [],
});

describe("Temporal Access Engine", () => {
  it("marks geometry evidence stale after TTL", () => {
    const result = evaluateTemporalAccess({
      ontologyConceptId: "physical.minimum_clear_width_mm",
      evidence: baseEvidence("2020-01-01T00:00:00.000Z"),
      at: "2026-07-17T00:00:00.000Z",
      freshnessDays: 365,
    });
    expect(["stale", "expired"]).toContain(result.state);
    expect(result.isFresh).toBe(false);
  });

  it("keeps fresh evidence current", () => {
    const result = evaluateTemporalAccess({
      ontologyConceptId: "physical.step_free",
      evidence: baseEvidence("2026-06-01T00:00:00.000Z"),
      at: "2026-07-17T00:00:00.000Z",
      freshnessDays: 365,
    });
    expect(result.state).toBe("current");
    expect(result.isFresh).toBe(true);
  });

  it("preserves unknown for lift without operational state", () => {
    const result = evaluateTemporalAccess({
      ontologyConceptId: "physical.lift_operational",
      evidence: {
        ...baseEvidence("2026-07-16T00:00:00.000Z"),
        ontologyConceptId: "physical.lift_operational",
        class: "synthetic_fixture",
      },
      at: "2026-07-17T00:00:00.000Z",
      operationalState: "unknown",
    });
    expect(result.state).toBe("unknown");
  });

  it("marks disputed and does not clear dispute via freshness", () => {
    const result = evaluateTemporalAccess({
      ontologyConceptId: "physical.accessible_toilet",
      evidence: baseEvidence("2026-07-01T00:00:00.000Z"),
      at: "2026-07-17T00:00:00.000Z",
      disputed: true,
    });
    expect(result.state).toBe("disputed");
  });

  it("fuses overlay to most severe state", () => {
    const overlay = fuseTemporalOverlay("place", "2026-07-17T00:00:00.000Z", [
      evaluateTemporalAccess({
        ontologyConceptId: "physical.step_free",
        evidence: baseEvidence("2026-06-01T00:00:00.000Z"),
        at: "2026-07-17T00:00:00.000Z",
      }),
      evaluateTemporalAccess({
        ontologyConceptId: "physical.lift_operational",
        evidence: {
          ...baseEvidence("2026-07-16T00:00:00.000Z"),
          ontologyConceptId: "physical.lift_operational",
        },
        at: "2026-07-17T00:00:00.000Z",
        operationalState: "unknown",
      }),
    ]);
    expect(overlay.overall).toBe("unknown");
  });
});

describe("Change detection", () => {
  const candidate = (over: Partial<AccessChangeCandidate>): AccessChangeCandidate => ({
    candidateId: "cand-1",
    subjectNodeId: "harbour_civic.entrance_west",
    ontologyConceptId: "physical.minimum_clear_width_mm",
    previousValue: 910,
    candidateValue: 820,
    source: "access_lens_synthetic",
    method: "device_assisted_estimate",
    evidenceClass: "model_candidate",
    observedAt: "2026-07-17T08:00:00.000Z",
    confidenceDimensions: { geometric: "low", semantic: "medium" },
    affectedRouteIds: ["harbour_civic.path_external"],
    potentialPublicImpact: "journey",
    expiryAt: null,
    ...over,
  });

  it("requires human review for model candidates that conflict", () => {
    const review = detectAccessChange(candidate({}));
    expect(review.autoOverwriteBlocked).toBe(true);
    expect(["human_review_required", "conflicts_with_existing", "possible_change"]).toContain(
      review.outcome,
    );
    expect(review.decision).toBe("pending");
  });

  it("classifies matching candidate as matches_existing", () => {
    const review = detectAccessChange(
      candidate({
        candidateValue: 910,
        evidenceClass: "mapper_observation",
        method: "mapper_survey",
      }),
    );
    expect(review.outcome).toBe("matches_existing");
  });

  it("classifies temporary obstruction without overwriting", () => {
    const review = detectAccessChange(
      candidate({
        subjectNodeId: "harbour_civic.path_external",
        ontologyConceptId: "physical.step_free",
        previousValue: true,
        candidateValue: false,
        evidenceClass: "community_observation",
        method: "temporary_furniture_report",
        expiryAt: "2026-07-18T00:00:00.000Z",
      }),
    );
    expect(review.outcome).toBe("temporary_change");
    expect(review.autoOverwriteBlocked).toBe(true);
  });
});
