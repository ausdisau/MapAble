import { compositeLocationAdapter } from "@/lib/search/composite-location-adapter";
import type { AutocompleteSuggestion } from "@/types/search";

/**
 * Location autocomplete: local searchable_locations + optional Australia Post suburbs.
 */
export interface LocationAutocompleteAdapter {
  search(query: string, limit: number): Promise<AutocompleteSuggestion[]>;
}

let activeAdapter: LocationAutocompleteAdapter = compositeLocationAdapter;

export function setLocationAutocompleteAdapter(adapter: LocationAutocompleteAdapter) {
  activeAdapter = adapter;
}

export function getLocationAutocompleteAdapter(): LocationAutocompleteAdapter {
  return activeAdapter;
}

export async function searchLocations(
  query: string,
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  return activeAdapter.search(query, limit);
}
