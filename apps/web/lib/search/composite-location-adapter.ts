import { isAuspostPacLocationSearchAvailable } from "@/lib/config/auspost-pac";
import { auspostLocationAdapter } from "@/lib/search/auspost-location-adapter";
import { localLocationAdapter } from "@/lib/search/local-location-adapter";
import type { LocationAutocompleteAdapter } from "@/lib/search/location-autocomplete-adapter";
import type { AutocompleteSuggestion } from "@/types/search";

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

function mergeLocationSuggestions(
  local: AutocompleteSuggestion[],
  remote: AutocompleteSuggestion[],
  limit: number,
): AutocompleteSuggestion[] {
  const seen = new Set<string>();
  const merged: AutocompleteSuggestion[] = [];

  for (const item of [...local, ...remote]) {
    const key = normalizeLabel(item.label);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    if (merged.length >= limit) break;
  }

  return merged;
}

/** Curated local suburbs first; fill remaining slots from Australia Post when configured. */
export const compositeLocationAdapter: LocationAutocompleteAdapter = {
  async search(query, limit) {
    const local = await localLocationAdapter.search(query, limit);

    if (!isAuspostPacLocationSearchAvailable() || local.length >= limit) {
      return local.slice(0, limit);
    }

    const remaining = limit - local.length;
    try {
      const auspost = await auspostLocationAdapter.search(query, remaining);
      if (auspost.length === 0) {
        console.warn(
          "[predictive-suggestions] AusPost location search returned no results",
          { query },
        );
      }
      return mergeLocationSuggestions(local, auspost, limit);
    } catch (err) {
      console.error("[predictive-suggestions] AusPost location search failed", err);
      return local.slice(0, limit);
    }
  },
};
