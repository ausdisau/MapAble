/** OpenStreetMap-backed geocoding and tile infrastructure. */

export const openStreetMapConfig = {
  enabled: process.env.OPENSTREETMAP_ENABLED === "true",
  nominatimEnabled: process.env.MAP_GEOCODING_NOMINATIM_ENABLED === "true",
  nominatimBaseUrl: (
    process.env.OSM_NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org"
  ).replace(/\/$/, ""),
  nominatimUserAgent:
    process.env.OSM_NOMINATIM_USER_AGENT ??
    "MapAbleAU-Geocoding/1.0 (https://mapable.com.au)",
  tileUrlTemplate:
    process.env.NEXT_PUBLIC_OSM_TILE_URL ??
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ?? "© OpenStreetMap contributors",
};

export function isOpenStreetMapConfigured(): boolean {
  return process.env.OPENSTREETMAP_ENABLED === "true";
}

export function isNominatimGeocodingConfigured(): boolean {
  const baseUrl = (
    process.env.OSM_NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org"
  ).replace(/\/$/, "");

  return (
    isOpenStreetMapConfigured() &&
    process.env.MAP_GEOCODING_NOMINATIM_ENABLED === "true" &&
    baseUrl.length > 0
  );
}
