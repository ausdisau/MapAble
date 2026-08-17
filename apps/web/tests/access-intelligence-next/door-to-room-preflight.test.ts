import { describe, expect, it } from "vitest";

import {
  runDoorToRoomPreflight,
  taylorRoom312Query,
} from "@/lib/access/intelligence-next";

describe("Door-to-room journey preflight", () => {
  it("builds full segment chain including return stub", () => {
    const { preflight, proof } = runDoorToRoomPreflight({
      query: taylorRoom312Query(),
      requirementSetRef: "fixture:taylor-harbour-v1",
    });

    expect(preflight.overallConclusion).toBe("cannot_confirm");
    expect(proof.conclusion).toBe("cannot_confirm");

    const kinds = preflight.segments.map((s) => s.kind);
    expect(kinds).toContain("origin");
    expect(kinds).toContain("entrance");
    expect(kinds).toContain("internal_route");
    expect(kinds).toContain("destination_room");
    expect(kinds).toContain("return_journey");
    expect(preflight.returnJourneyEvaluated).toBe(false);

    expect(preflight.excludedAlternatives.some((a) => a.includes("entrance_staff"))).toBe(
      true,
    );
    expect(preflight.unresolvedHardRequirements.length).toBeGreaterThan(0);
    expect(preflight.suggestedConfirmations.length).toBeGreaterThan(0);
    expect(preflight.dependencyGraph.singlePointsOfFailure.length).toBeGreaterThan(0);

    const lift = preflight.segments.find((s) => s.id === "seg-lift");
    expect(lift?.personalFit).toBe("operational_status_unknown");
    expect(lift?.confirmationRequired).toBe(true);

    expect(preflight.burden.attributedTo.length).toBeGreaterThan(0);
    expect(preflight.limitations.some((l) => /not a journey completed/i.test(l))).toBe(true);
  });

  it("exposes segment list fields for accessible UI", () => {
    const { preflight } = runDoorToRoomPreflight({
      query: taylorRoom312Query(),
      requirementSetRef: "fixture:taylor-harbour-v1",
    });
    for (const s of preflight.segments) {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.geometrySummary.length).toBeGreaterThan(0);
      expect(s.responsibleOrganisation.length).toBeGreaterThan(0);
    }
  });
});
