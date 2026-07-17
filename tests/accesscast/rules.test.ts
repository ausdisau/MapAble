import { describe, expect, it } from "vitest";

import {
  calculateForecastState,
  evidenceClassMayIndependentlyBlock,
  modelCandidateCannotIndependentlyBlock,
  type AccessCastCondition,
  type AccessCastRequirement,
  type AccessCastSegment,
} from "@/lib/accesscast";

function req(
  partial: Partial<AccessCastRequirement> & Pick<AccessCastRequirement, "status">,
): AccessCastRequirement {
  return {
    ontologyConceptId: "physical.lift_operational",
    kind: "require",
    detail: "test",
    hard: true,
    ...partial,
  };
}

function seg(partial: Partial<AccessCastSegment>): AccessCastSegment {
  return {
    segmentId: "s1",
    kind: "internal_route",
    label: "Lift",
    currentState: "cannot_confirm",
    futureState: null,
    evidenceSummary: "test",
    freshness: "unknown",
    reliability: "cannot_forecast",
    hardRequirementEffect: "unresolved",
    fallback: null,
    confirmationTask: null,
    responsibleOrganisation: "Venue",
    canonicalRef: "harbour_civic.lift_a",
    singlePointOfFailure: false,
    ...partial,
  };
}

describe("AccessCast deterministic rules", () => {
  it("returns cannot_confirm for unknown hard requirements", () => {
    const state = calculateForecastState({
      requirements: [req({ status: "unresolved" })],
      conditions: [],
      segments: [seg({})],
      fallback: null,
    });
    expect(state).toBe("cannot_confirm");
  });

  it("failed hard requirements cannot return stable", () => {
    const state = calculateForecastState({
      requirements: [req({ status: "failed" })],
      conditions: [],
      segments: [seg({ currentState: "stable", hardRequirementEffect: "blocked" })],
      fallback: null,
    });
    expect(state).toBe("temporarily_unavailable");
    expect(state).not.toBe("stable");
  });

  it("single point of failure without verified fallback produces fragile", () => {
    const state = calculateForecastState({
      requirements: [req({ status: "matched", ontologyConceptId: "physical.step_free" })],
      conditions: [],
      segments: [
        seg({
          currentState: "fragile",
          hardRequirementEffect: "supported",
          singlePointOfFailure: true,
          fallback: {
            fallbackId: "fb1",
            label: "None",
            verified: false,
            summary: "No verified fallback",
            limitations: [],
          },
        }),
      ],
      fallback: {
        fallbackId: "fb1",
        label: "None",
        verified: false,
        summary: "No verified fallback",
        limitations: [],
      },
    });
    expect(state).toBe("fragile");
  });

  it("stale critical evidence remains stale", () => {
    const state = calculateForecastState({
      requirements: [req({ status: "matched" })],
      conditions: [],
      segments: [
        seg({
          freshness: "stale",
          hardRequirementEffect: "unresolved",
          currentState: "stale",
        }),
      ],
      fallback: null,
    });
    expect(state).toBe("stale");
  });

  it("model candidates cannot independently block a route", () => {
    expect(evidenceClassMayIndependentlyBlock("model_candidate")).toBe(false);

    const conditions: AccessCastCondition[] = [
      {
        conditionId: "c1",
        label: "Vision candidate",
        kind: "model_candidate",
        effectiveFrom: null,
        effectiveTo: null,
        affectsSegmentIds: ["s1"],
        evidenceClass: "model_candidate",
        summary: "Possible barrier",
        independentlyBlocks: false,
      },
    ];

    const state = calculateForecastState({
      requirements: [req({ status: "matched", ontologyConceptId: "physical.step_free" })],
      conditions,
      segments: [
        seg({
          currentState: "likely_usable",
          hardRequirementEffect: "supported",
          singlePointOfFailure: false,
        }),
      ],
      fallback: null,
    });

    expect(state).not.toBe("temporarily_unavailable");
    expect(modelCandidateCannotIndependentlyBlock(conditions, state)).toBe(true);
  });

  it("offline expired data cannot produce stable", () => {
    const state = calculateForecastState({
      requirements: [req({ status: "matched" })],
      conditions: [],
      segments: [seg({ currentState: "stable", hardRequirementEffect: "supported" })],
      fallback: null,
      offlineExpired: true,
    });
    expect(state).toBe("stale");
  });
});
