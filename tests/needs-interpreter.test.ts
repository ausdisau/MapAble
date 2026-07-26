import { describe, expect, it } from "vitest";

import {
  buildClarificationQuestion,
  hasUnresolvedAccessNeeds,
  needsProviderFinderClarification,
} from "@/lib/provider/finder/clarification";
import type { SearchInterpretation } from "@/types/search";

function baseInterpretation(
  overrides: Partial<SearchInterpretation>,
): SearchInterpretation {
  return {
    sourceQuery: "test",
    parsed: true,
    configured: true,
    filters: {
      q: "support",
      location: "Parramatta",
      access: "",
      service: "support worker",
      provider: "",
    },
    serviceCategorySlug: "support-coordination",
    serviceCategoryId: null,
    accessNeedIds: [],
    accessNeeds: { ids: [], confidence: 0, source: "none" },
    confidence: 0.8,
    engineId: "test",
    ...overrides,
  };
}

describe("access needs clarification", () => {
  it("flags unresolved access even when location and service are present", () => {
    const interpretation = baseInterpretation({
      filters: {
        q: "support",
        location: "Parramatta",
        access: "very specific custom need",
        service: "support worker",
        provider: "",
      },
      accessNeeds: {
        ids: [],
        confidence: 0.2,
        source: "none",
        unmatchedText: "very specific custom need",
      },
    });
    expect(hasUnresolvedAccessNeeds(interpretation)).toBe(true);
    expect(needsProviderFinderClarification(interpretation)).toBe(true);
    expect(buildClarificationQuestion(interpretation)).toContain("access needs");
  });

  it("does not clarify when access need ids resolved", () => {
    const interpretation = baseInterpretation({
      filters: {
        q: "support",
        location: "Parramatta",
        access: "Auslan",
        service: "support worker",
        provider: "",
      },
      accessNeedIds: ["auslan"],
      accessNeeds: { ids: ["auslan"], confidence: 0.75, source: "keyword" },
    });
    expect(hasUnresolvedAccessNeeds(interpretation)).toBe(false);
    expect(needsProviderFinderClarification(interpretation)).toBe(false);
  });
});
