import { searchPostcodes } from "@/lib/auspost-pac/postcode-search-service";
import type { LocationAutocompleteAdapter } from "@/lib/search/location-autocomplete-adapter";
import type { AusPostState } from "@/types/auspost-pac";
import type { AutocompleteSuggestion } from "@/types/search";

function titleCaseLocation(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function mapLocality(
  loc: { location: string; state: string; postcode: string },
  index: number,
): AutocompleteSuggestion {
  const suburb = titleCaseLocation(loc.location);
  const state = loc.state;
  const label = `${suburb} ${state}`;
  return {
    id: `auspost-${loc.postcode}-${loc.state}-${index}`,
    type: "location",
    typeLabel: "Location",
    label,
    description: `${suburb}, ${state} ${loc.postcode}`,
    value: label,
    metadata: {
      suburb,
      state,
      postcode: loc.postcode,
    },
  };
}

/** Australia Post PAC postcode search for suburb/postcode autocomplete. */
export const auspostLocationAdapter: LocationAutocompleteAdapter = {
  async search(query, limit) {
    const q = query.trim();
    if (q.length < 2) return [];

    const { localities } = await searchPostcodes({
      q,
      excludePostBox: true,
    });

    return localities.slice(0, limit).map((loc, index) => mapLocality(loc, index));
  },
};

export async function searchPostcodesWithState(
  query: string,
  limit: number,
  state?: AusPostState,
): Promise<AutocompleteSuggestion[]> {
  const { localities } = await searchPostcodes({
    q: query.trim(),
    state,
    excludePostBox: true,
  });
  return localities.slice(0, limit).map((loc, index) => mapLocality(loc, index));
}
