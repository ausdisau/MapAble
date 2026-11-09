import { describe, expect, it } from "vitest";

import {
  DEMO_MAP_PLACES,
  MAPATHON_CHALLENGES,
  MODE_OPTIONS,
  getChallenge,
  getEligiblePlaces,
  getFeature,
  validatePracticeDraft,
  assertDemoMapathonIsUnpublished,
  type MapathonFocus,
} from "@/lib/mapathon/demo";

const validInput = {
  placeId: "demo-crossing",
  challengeId: "journeys" as MapathonFocus,
  featureId: "path" as const,
  mode: "remote" as const,
  role: "researcher" as const,
  source: "unknown" as const,
  detail: "Source information is incomplete for this crossing.",
  measurementMm: null,
};

describe("MapAble Signal mapathon UI fixtures", () => {
  it("keeps all place and campaign data synthetic and unpublished", () => {
    expect(assertDemoMapathonIsUnpublished()).toBe(true);
    expect(MAPATHON_CHALLENGES).toHaveLength(5);
    expect(DEMO_MAP_PLACES).toHaveLength(4);
    expect(MAPATHON_CHALLENGES.every((item) => item.synthetic && !item.published)).toBe(true);
    expect(DEMO_MAP_PLACES.every((item) => item.synthetic && !item.published)).toBe(true);
  });

  it("keeps an accessible remote participation option", () => {
    expect(MODE_OPTIONS.map((item) => item.id)).toContain("remote");
    expect(MAPATHON_CHALLENGES.every((item) => getEligiblePlaces(item.id).length > 0)).toBe(true);
  });

  it("does not treat unknown as a failed mapping contribution", () => {
    expect(validatePracticeDraft(validInput)).toBeNull();
    expect(getFeature("doorway").measurement).toBe("mm");
    expect(getChallenge("journeys").featureIds).toContain("path");
  });

  it("prevents invalid place-theme bindings and wrong features", () => {
    expect(validatePracticeDraft({ ...validInput, placeId: "demo-library" })).toMatch(/matching/i);
    expect(validatePracticeDraft({ ...validInput, featureId: "toilet" })).toMatch(/feature/i);
  });

  it("does not allow direct observations in remote-only practice", () => {
    expect(validatePracticeDraft({ ...validInput, source: "direct" })).toMatch(/remote/i);
    expect(validatePracticeDraft({ ...validInput, detail: "Short" })).toMatch(/8 to 400/i);
  });

  it("only accepts direct doorway measurements with valid values", () => {
    const sample = {
      ...validInput,
      challengeId: "entrances" as const,
      placeId: "demo-library",
      featureId: "doorway" as const,
      mode: "field" as const,
      source: "direct" as const,
      measurementMm: 870,
    };
    expect(validatePracticeDraft(sample)).toBeNull();
    expect(validatePracticeDraft({ ...sample, measurementMm: -10 })).toMatch(/measurement/i);
    expect(validatePracticeDraft({ ...sample, source: "venue" })).toMatch(/direct-observation/i);
  });

  it("does not represent a source or measurement as a verified access result", () => {
    expect(validatePracticeDraft({ ...validInput, measurementMm: 850 })).toMatch(/measurement/i);
    expect(validatePracticeDraft({ ...validInput, source: "not-real" as "unknown" })).toMatch(/information/i);
  });
});
