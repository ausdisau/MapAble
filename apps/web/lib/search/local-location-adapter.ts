import { prisma } from "@/lib/prisma";
import type { AutocompleteSuggestion } from "@/types/search";

import type { LocationAutocompleteAdapter } from "./location-autocomplete-adapter";

/** Local searchable_locations table (no external geocoder). */
export const localLocationAdapter: LocationAutocompleteAdapter = {
  async search(query, limit) {
    const q = query.trim();
    if (q.length < 2) return [];

    try {
      const rows = await prisma.searchableLocation.findMany({
        where: {
          OR: [
            { displayName: { contains: q, mode: "insensitive" } },
            { suburb: { contains: q, mode: "insensitive" } },
            { postcode: { contains: q, mode: "insensitive" } },
            { state: { contains: q, mode: "insensitive" } },
          ],
        },
        take: limit,
        orderBy: { displayName: "asc" },
      });

      return rows.map((row) => ({
        id: `location-${row.id}`,
        type: "location" as const,
        typeLabel: "Location",
        label: row.displayName,
        description: [row.suburb, row.state, row.postcode].filter(Boolean).join(", "),
        value: row.displayName,
        metadata: {
          suburb: row.suburb ?? undefined,
          state: row.state ?? undefined,
          postcode: row.postcode ?? undefined,
        },
      }));
    } catch (err) {
      console.error("[predictive-suggestions] location search failed", err);
      throw err;
    }
  },
};

export async function listProactiveLocations(
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const rows = await prisma.searchableLocation.findMany({
    take: limit,
    orderBy: { displayName: "asc" },
  });
  return rows.map((row) => ({
    id: `location-${row.id}`,
    type: "location" as const,
    typeLabel: "Location",
    label: row.displayName,
    description: [row.suburb, row.state, row.postcode].filter(Boolean).join(", "),
    value: row.displayName,
    metadata: {
      suburb: row.suburb ?? undefined,
      state: row.state ?? undefined,
      postcode: row.postcode ?? undefined,
    },
  }));
}
