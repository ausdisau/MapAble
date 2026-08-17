import { describe, expect, it } from "vitest";

import {
  getStaticProactiveCatalog,
  getStaticReactiveSuggestions,
  getStaticFallbackGroups,
  isSuggestionGroupsEmpty,
} from "@/lib/search/suggestion-fallback-catalog";

describe("suggestion-fallback-catalog", () => {
  it("returns proactive suggestions without a database", () => {
    const { suggestions } = getStaticProactiveCatalog(10);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((s) => s.type === "popular_search")).toBe(true);
  });

  it("returns reactive matches for physio", () => {
    const suggestions = getStaticReactiveSuggestions("physio", 10, "all");
    expect(suggestions.some((s) => s.label.toLowerCase().includes("physio"))).toBe(
      true,
    );
  });

  it("builds grouped proactive fallback", () => {
    const groups = getStaticFallbackGroups("proactive", "", "all");
    expect(isSuggestionGroupsEmpty(groups)).toBe(false);
  });
});
