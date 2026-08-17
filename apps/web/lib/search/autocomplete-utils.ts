import type {
  AutocompleteGroupedResult,
  AutocompleteSuggestion,
  SuggestionMode,
} from "@/types/search";

/** Client-safe helpers (no Prisma). */

export function flattenSuggestions(
  groups: AutocompleteGroupedResult,
): AutocompleteSuggestion[] {
  return [
    ...groups.providers,
    ...groups.services,
    ...groups.locations,
    ...groups.accessibilityFeatures,
    ...groups.languages,
    ...groups.popularSearches,
  ];
}

export function buildLiveRegionMessage(
  loading: boolean,
  count: number,
  query: string,
  mode: SuggestionMode = "reactive",
): string {
  if (loading) return "Loading suggestions.";
  const q = query.trim();
  if (mode === "proactive" && q.length < 2) {
    if (count === 0) return "No suggested searches available.";
    return `${count} suggested search${count === 1 ? "" : "es"} available.`;
  }
  if (q.length < 2) {
    return "Type at least 2 characters for suggestions.";
  }
  if (count === 0) return `No suggestions found for ${query}.`;
  return `${count} suggestion${count === 1 ? "" : "s"} available.`;
}
