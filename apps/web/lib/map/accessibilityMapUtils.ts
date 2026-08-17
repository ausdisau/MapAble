/** WGS84 coordinate tuple [latitude, longitude]. */
export type LatLngTuple = [number, number];

/** Australian geographic centre fallback when no valid marker coordinates exist. */
export const AUSTRALIA_FALLBACK_CENTER: LatLngTuple = [-25.2744, 133.7751];
export const AUSTRALIA_FALLBACK_ZOOM = 4;
export const SINGLE_MARKER_ZOOM = 14;

export type CoordinatePlace = {
  latitude?: number | null;
  longitude?: number | null;
};

function parseCoordinate(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  return num;
}

/** Returns true when a place has valid WGS84 coordinates suitable for map markers. */
export function hasValidCoordinates(place: CoordinatePlace): boolean {
  const lat = parseCoordinate(place.latitude);
  const lng = parseCoordinate(place.longitude);
  if (lat === null || lng === null) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

/** Extract [lat, lng] tuple from a place, or null if invalid. */
export function getPlaceCoordinates(place: CoordinatePlace): LatLngTuple | null {
  if (!hasValidCoordinates(place)) return null;
  return [parseCoordinate(place.latitude)!, parseCoordinate(place.longitude)!];
}

/** Split filtered places into mappable and missing-coordinate groups. */
export function partitionPlacesByCoordinates<T extends CoordinatePlace>(
  places: T[],
): { mappable: T[]; missingCoordinates: T[] } {
  const mappable: T[] = [];
  const missingCoordinates: T[] = [];
  for (const place of places) {
    if (hasValidCoordinates(place)) {
      mappable.push(place);
    } else {
      missingCoordinates.push(place);
    }
  }
  return { mappable, missingCoordinates };
}

/** Build a stable key from coordinate tuples for fit-bounds change detection. */
export function coordinatesKey(coords: LatLngTuple[]): string {
  return coords
    .map(([lat, lng]) => `${lat.toFixed(6)},${lng.toFixed(6)}`)
    .sort()
    .join("|");
}

/** Tier abbreviation for marker display (non-colour indicator). */
export function tierAbbreviation(tier: string): string {
  switch (tier) {
    case "Gold":
      return "G";
    case "Silver":
      return "S";
    case "Bronze":
      return "B";
    case "Unverified":
      return "U";
    default:
      return tier.charAt(0).toUpperCase();
  }
}

/** CSS class suffix for marker tier styling. */
export function tierMarkerClass(tier: string): string {
  switch (tier) {
    case "Gold":
      return "access-map-marker--gold";
    case "Silver":
      return "access-map-marker--silver";
    case "Bronze":
      return "access-map-marker--bronze";
    case "Unverified":
      return "access-map-marker--unverified";
    default:
      return "access-map-marker--default";
  }
}

/** Category icon letter for marker (non-colour indicator). */
export function categoryIconLetter(category: string): string {
  switch (category) {
    case "library":
      return "L";
    case "cafe_restaurant":
      return "C";
    case "public_toilet":
      return "T";
    case "other":
      return "V";
    default:
      return category.charAt(0).toUpperCase();
  }
}

/** Check if user prefers reduced motion. Safe for SSR. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
