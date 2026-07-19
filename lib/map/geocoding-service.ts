import { forwardGeocodeAustralia } from "@/lib/map/nominatim-server";
import { prisma } from "@/lib/prisma";


export type GeocodeInput = {
  suburb?: string;
  postcode?: string;
  state?: string;
};

function buildDisplayQuery(input: GeocodeInput): string {
  return [input.suburb, input.state, input.postcode].filter(Boolean).join(" ").trim();
}

/**
 * Resolve suburb/postcode (and optional state) to coordinates.
 * Uses searchable_locations as a hint, then optional Nominatim when enabled.
 */
export async function geocodeSuburbPostcode(
  suburb?: string,
  postcode?: string,
  state?: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!suburb && !postcode) return null;

  const row = await prisma.searchableLocation.findFirst({
    where: {
      AND: [
        suburb
          ? { suburb: { equals: suburb, mode: "insensitive" as const } }
          : {},
        postcode ? { postcode } : {},
        state ? { state: { equals: state, mode: "insensitive" as const } } : {},
      ].filter((clause) => Object.keys(clause).length > 0),
    },
  });

  const query =
    row?.displayName ?? buildDisplayQuery({ suburb, postcode, state });

  if (process.env.MAP_GEOCODING_NOMINATIM_ENABLED === "true" && query) {
    return forwardGeocodeAustralia(query);
  }

  return null;
}
