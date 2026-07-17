import { describe, expect, it } from "vitest";

import {
  HARBOUR_PLACE_REF,
  compileAccessCastOfflinePack,
  evaluateOfflineAccessCast,
  forecastHarbourPlaceOutlook,
  forecastStartingWorkJourney,
  harbourCanonicalNodeIds,
} from "@/lib/accesscast";

describe("AccessCast Harbour place outlook", () => {
  it("references canonical Harbour fixture IDs", () => {
    const ids = harbourCanonicalNodeIds();
    expect(ids).toContain("harbour_civic.lift_a");
    expect(ids).toContain("harbour_civic.entrance_west");
    expect(ids).toContain("harbour_civic.room_3_12");

    const result = forecastHarbourPlaceOutlook({ scenarioId: "harbour_place_baseline" });
    expect(result.envelope.journeyOrPlaceRef).toBe(HARBOUR_PLACE_REF);
    expect(result.segments.some((s) => s.canonicalRef === "harbour_civic.lift_a")).toBe(true);
    expect(result.synthetic).toBe(true);
    expect(result.productionClaim).toBe("none");
  });

  it("unknown hard requirements return cannot_confirm", () => {
    const result = forecastHarbourPlaceOutlook({ scenarioId: "harbour_place_baseline" });
    expect(result.state).toBe("cannot_confirm");
    expect(result.envelope.unresolvedRequirements.length).toBeGreaterThan(0);
  });

  it("failed hard requirements cannot return stable", () => {
    const result = forecastHarbourPlaceOutlook({ scenarioId: "harbour_lift_outage" });
    expect(result.state).toBe("temporarily_unavailable");
    expect(result.state).not.toBe("stable");
    expect(result.envelope.failedRequirements.length).toBeGreaterThan(0);
  });

  it("stale evidence remains stale on journey outlook", () => {
    const result = forecastStartingWorkJourney({ scenarioId: "starting_work_tomorrow" });
    const lift = result.segments.find((s) => s.segmentId === "seg-lift");
    expect(lift?.freshness).toBe("stale");
    expect(["stale", "cannot_confirm", "fragile"]).toContain(result.state);
  });

  it("model candidates cannot independently block", () => {
    const result = forecastHarbourPlaceOutlook({ scenarioId: "harbour_vision_candidate" });
    expect(result.state).not.toBe("temporarily_unavailable");
    expect(result.envelope.conditions.some((c) => c.kind === "model_candidate")).toBe(true);
    expect(
      result.why.some((w) => /vision|unverified/i.test(w)) ||
        result.limitations.some((l) => /model/i.test(l)),
    ).toBe(true);
  });

  it("includes evidence envelope and limitations", () => {
    const result = forecastHarbourPlaceOutlook();
    expect(result.envelope.forecastId).toBeTruthy();
    expect(result.envelope.sourceEvidence.length).toBeGreaterThan(0);
    expect(result.envelope.confidenceHorizon).toBeTruthy();
    expect(result.envelope.expiry).toBeTruthy();
    expect(result.limitations.length).toBeGreaterThan(0);
    expect(result.listAlternative.length).toBe(result.segments.length);
  });

  it("conflicting sources return conflicting", () => {
    const result = forecastHarbourPlaceOutlook({ scenarioId: "harbour_conflicting_lift" });
    expect(result.state).toBe("conflicting");
  });
});

describe("AccessCast Starting Work journey", () => {
  it("builds full journey including return and confirmation tasks", () => {
    const result = forecastStartingWorkJourney({ scenarioId: "starting_work_tomorrow" });
    expect(result.journeyLabel).toMatch(/Harbour Civic Centre/i);
    const kinds = result.segments.map((s) => s.kind);
    expect(kinds).toContain("origin");
    expect(kinds).toContain("transport");
    expect(kinds).toContain("entrance");
    expect(kinds).toContain("return_journey");
    expect(result.timeline.length).toBeGreaterThanOrEqual(5);
    expect(result.suggestedChecks.some((c) => /vehicle/i.test(c))).toBe(true);
    expect(["fragile", "cannot_confirm", "stale"]).toContain(result.state);
  });

  it("return journey fragility keeps whole journey fragile or unresolved", () => {
    const result = forecastStartingWorkJourney({ scenarioId: "return_journey_fragile" });
    const ret = result.segments.find((s) => s.kind === "return_journey");
    expect(ret?.currentState).toBe("fragile");
    expect(ret?.singlePointOfFailure).toBe(true);
    expect(["fragile", "cannot_confirm", "stale"]).toContain(result.state);
  });
});

describe("AccessCast offline Visit Pack projection", () => {
  it("marks expired offline packs as stale and changed-since-saved", () => {
    const result = forecastHarbourPlaceOutlook();
    const pack = compileAccessCastOfflinePack(result);
    expect(pack.offlineClaim).toBe("saved_snapshot_only");
    expect(pack.generatedAt).toBeTruthy();
    expect(pack.expiresAt).toBeTruthy();

    const evaluation = evaluateOfflineAccessCast(pack, "2099-01-01T00:00:00.000Z");
    expect(evaluation.expired).toBe(true);
    expect(evaluation.effectiveState).toBe("stale");
    expect(evaluation.changedSinceSaved).toBe(true);
    expect(evaluation.limitations.some((l) => /silently|current/i.test(l))).toBe(true);
  });
});
