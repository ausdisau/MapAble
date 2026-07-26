import { describe, expect, it } from "vitest";

import {
  getClarificationGuidance,
  getFilledSlots,
  needsProviderFinderClarification,
} from "@/lib/provider/finder/clarification";
import type { SearchInterpretation } from "@/types/search";

function baseInterpretation(
  overrides: Partial<SearchInterpretation> = {},
): SearchInterpretation {
  return {
    sourceQuery: "support",
    parsed: true,
    configured: true,
    filters: { q: "", location: "", access: "", service: "", provider: "" },
    serviceCategorySlug: null,
    serviceCategoryId: null,
    accessNeedIds: [],
    accessNeeds: { ids: [], confidence: 0, source: "none" },
    confidence: 0.3,
    engineId: "test",
    ...overrides,
  };
}

describe("clarification guidance", () => {
  it("marks service slot when service is missing", () => {
    const interpretation = baseInterpretation({
      filters: { q: "help", location: "Parramatta", access: "", service: "", provider: "" },
      confidence: 0.2,
    });

    expect(needsProviderFinderClarification(interpretation)).toBe(true);
    const guidance = getClarificationGuidance(interpretation);
    expect(guidance.clarificationSlot).toBe("service");
    expect(guidance.suggestedChoices?.length).toBeGreaterThan(0);
    expect(guidance.suggestedChoices?.some((c) => c.label === "Personal care")).toBe(
      true,
    );
  });

  it("marks location slot when location is missing", () => {
    const interpretation = baseInterpretation({
      filters: {
        q: "support worker",
        location: "",
        access: "",
        service: "support worker",
        provider: "",
      },
      serviceCategorySlug: "support-work",
      confidence: 0.2,
    });

    const guidance = getClarificationGuidance(interpretation);
    expect(guidance.clarificationSlot).toBe("location");
    expect(guidance.suggestedChoices).toBeUndefined();
  });

  it("marks access slot with ACCESS_NEEDS choices", () => {
    const interpretation = baseInterpretation({
      filters: {
        q: "provider",
        location: "Sydney",
        access: "wheelchair hoist",
        service: "therapy",
        provider: "",
      },
      accessNeedIds: [],
      accessNeeds: { ids: [], confidence: 0.1, source: "keyword" },
      confidence: 0.9,
    });

    const guidance = getClarificationGuidance(interpretation);
    expect(guidance.clarificationSlot).toBe("access");
    expect(guidance.suggestedChoices?.some((c) => c.label === "Wheelchair access")).toBe(
      true,
    );
  });

  it("tracks filled slots", () => {
    const interpretation = baseInterpretation({
      filters: {
        q: "ot",
        location: "Newcastle",
        access: "",
        service: "occupational therapy",
        provider: "",
      },
      serviceCategorySlug: "occupational-therapy",
      confidence: 0.9,
    });

    expect(getFilledSlots(interpretation)).toEqual({
      location: true,
      service: true,
      access: false,
    });
    expect(needsProviderFinderClarification(interpretation)).toBe(false);
    expect(getClarificationGuidance(interpretation).clarificationSlot).toBeUndefined();
  });
});
