import { forwardGeocodeAustralia } from "@/lib/map/nominatim-server";

export type GeocodeLocationResult = {
  found: boolean;
  lat?: number;
  lng?: number;
  message: string;
};

/** Geocode an Australian suburb, city, or postcode for map/search context. */
export async function geocodeLocation(
  location: string,
): Promise<GeocodeLocationResult> {
  const query = location.trim();
  if (!query) {
    return { found: false, message: "Location query is empty." };
  }

  const coords = await forwardGeocodeAustralia(query);
  if (!coords) {
    return {
      found: false,
      message: `Could not geocode "${query}" in Australia. Try a suburb and state or a 4-digit postcode.`,
    };
  }

  return {
    found: true,
    lat: coords.lat,
    lng: coords.lng,
    message: `Geocoded "${query}" to ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}.`,
  };
}
