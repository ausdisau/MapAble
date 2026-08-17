import { describe, expect, it, vi } from "vitest";

import {
  buildLiveRegionMessage,
  searchAutocomplete,
  searchAutocompleteWithMeta,
} from "@/lib/search/autocomplete-service";

const mockSearchPredictive = vi.hoisted(() => vi.fn());

vi.mock("@/lib/search/predictive-suggestion-engine", () => ({
  searchPredictiveSuggestions: mockSearchPredictive,
}));

describe("searchAutocomplete", () => {
  it("returns empty groups for short query", async () => {
    mockSearchPredictive.mockResolvedValueOnce({
      groups: {
        providers: [],
        services: [],
        locations: [],
        accessibilityFeatures: [],
        languages: [],
        popularSearches: [],
      },
      meta: { mode: "reactive", degraded: false },
    });

    const result = await searchAutocomplete({
      query: "a",
      context: "homepage",
    });
    expect(result.providers).toEqual([]);
    expect(result.services).toEqual([]);
  });
});

describe("searchAutocompleteWithMeta", () => {
  it("applies static fallback when engine returns empty proactive groups", async () => {
    mockSearchPredictive.mockResolvedValueOnce({
      groups: {
        providers: [],
        services: [],
        locations: [],
        accessibilityFeatures: [],
        languages: [],
        popularSearches: [],
      },
      meta: { mode: "proactive", degraded: false },
    });

    const result = await searchAutocompleteWithMeta({
      mode: "proactive",
      query: "",
      context: "homepage",
    });

    expect(result.meta.degraded).toBe(true);
    expect(result.meta.degradedReason).toContain("static_fallback");
    expect(
      result.groups.popularSearches.length +
        result.groups.services.length +
        result.groups.locations.length,
    ).toBeGreaterThan(0);
  });

  it("returns meta for proactive mode", async () => {
    mockSearchPredictive.mockResolvedValueOnce({
      groups: {
        providers: [],
        services: [],
        locations: [],
        accessibilityFeatures: [],
        languages: [],
        popularSearches: [
          {
            id: "p1",
            type: "popular_search",
            typeLabel: "Popular",
            label: "Personal care",
            value: "Personal care",
          },
        ],
      },
      meta: { mode: "proactive", degraded: false },
    });

    const result = await searchAutocompleteWithMeta({
      mode: "proactive",
      query: "",
      context: "homepage",
    });
    expect(result.meta.mode).toBe("proactive");
  });
});

describe("buildLiveRegionMessage", () => {
  it("describes loading state", () => {
    expect(buildLiveRegionMessage(true, 0, "phys")).toBe("Loading suggestions.");
  });

  it("describes no results", () => {
    expect(buildLiveRegionMessage(false, 0, "physio")).toBe(
      "No suggestions found for physio.",
    );
  });

  it("describes suggestion count", () => {
    expect(buildLiveRegionMessage(false, 3, "para")).toBe(
      "3 suggestions available.",
    );
  });

  it("describes proactive suggestions", () => {
    expect(buildLiveRegionMessage(false, 3, "", "proactive")).toBe(
      "3 suggested searches available.",
    );
  });
});
