import { describe, expect, it } from "vitest";

import { calculateAccessFit } from "@/lib/access-fit/calculate-access-fit";
import {
  DEMO_ACCESS_NEEDS,
  EMPTY_ACCESS_NEEDS,
  type PlaceAccessProfile,
} from "@/lib/access-fit/types";
import { DEMO_ACCESS_PLACES } from "@/lib/demo/accessibility-places";

const strongProfile: PlaceAccessProfile = {
  stepFreeEntry: true,
  doorWidthMm: 1000,
  internalStepFree: true,
  accessibleToilet: true,
  accessibleParking: true,
  dropOffPoint: true,
  lowSensoryOption: true,
  hearingLoop: true,
  staffTraining: true,
  assistanceAnimalWelcome: true,
  publicTransportNearby: true,
  transportBookable: true,
  lastVerified: "2026-06-01",
  confidence: "high",
};

describe("calculateAccessFit", () => {
  it("returns unknown when no needs are selected", () => {
    const result = calculateAccessFit(EMPTY_ACCESS_NEEDS, strongProfile);
    expect(result.label).toBe("unknown");
    expect(result.score).toBe(0);
  });

  it("scores a strong fit for matching demo wheelchair needs", () => {
    const result = calculateAccessFit(DEMO_ACCESS_NEEDS, strongProfile);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.label).toBe("strong fit");
    expect(result.barriers).toHaveLength(0);
  });

  it("flags barriers and recommended questions", () => {
    const result = calculateAccessFit(DEMO_ACCESS_NEEDS, {
      ...strongProfile,
      stepFreeEntry: false,
      accessibleToilet: null,
    });
    expect(result.barriers.length).toBeGreaterThan(0);
    expect(result.unknowns.length).toBeGreaterThan(0);
    expect(result.recommendedQuestions.length).toBeGreaterThan(0);
    expect(["needs confirmation", "likely barrier"]).toContain(result.label);
  });

  it("works against demo place profiles", () => {
    const cafe = DEMO_ACCESS_PLACES.find((place) => place.slug === "king-street-step-free-cafe");
    expect(cafe).toBeTruthy();
    const result = calculateAccessFit(DEMO_ACCESS_NEEDS, cafe!.profile);
    expect(result.score).toBeGreaterThan(0);
    expect(result.recommendedQuestions.length).toBeGreaterThan(0);
  });
});
