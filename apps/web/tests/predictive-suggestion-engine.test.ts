import { describe, expect, it, vi, beforeEach } from "vitest";

import { searchPredictiveSuggestions } from "@/lib/search/predictive-suggestion-engine";

vi.mock("@/lib/search/service-autocomplete", () => ({
  listProactiveCatalog: vi.fn(async () => ({
    suggestions: [
      {
        id: "popular-1",
        type: "popular_search",
        typeLabel: "Popular",
        label: "Personal care",
        value: "Personal care",
      },
    ],
    popularWeights: [["personal care", 10]],
    failed: false,
    usedFallback: false,
  })),
  listProactiveAccessibility: vi.fn(),
  listProactiveLanguages: vi.fn(),
  searchAccessibilityFeatures: vi.fn(async () => []),
  searchLanguages: vi.fn(async () => []),
  searchPopularSearches: vi.fn(async () => []),
  searchServiceCategories: vi.fn(async () => []),
}));

vi.mock("@/lib/search/provider-autocomplete", () => ({
  searchProviders: vi.fn(async () => []),
  listProactiveProviders: vi.fn(),
}));

vi.mock("@/lib/search/location-autocomplete-adapter", () => ({
  searchLocations: vi.fn(async () => []),
}));

vi.mock("@/lib/search/local-location-adapter", () => ({
  listProactiveLocations: vi.fn(),
}));

describe("searchPredictiveSuggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns proactive catalog without query", async () => {
    const result = await searchPredictiveSuggestions({
      mode: "proactive",
      query: "",
      context: "homepage",
      field: "all",
    });

    expect(result.meta.mode).toBe("proactive");
    expect(result.groups.popularSearches.length + result.groups.services.length).toBeGreaterThan(0);
  });

  it("returns empty groups for short reactive query", async () => {
    const result = await searchPredictiveSuggestions({
      mode: "reactive",
      query: "a",
      context: "homepage",
    });

    expect(result.groups.providers).toEqual([]);
    expect(result.meta.mode).toBe("reactive");
  });
});
