import type { AccessPlaceCategory } from "@prisma/client";

import type { ParsedKmlPlacemark } from "@/lib/access/import/kml-parser-service";

const CATEGORY_HINTS: Record<string, AccessPlaceCategory> = {
  cafe: "cafe_restaurant",
  restaurant: "cafe_restaurant",
  shop: "shop",
  park: "park",
  beach: "beach",
  library: "library",
  museum: "museum_gallery",
  toilet: "public_toilet",
  transport: "transport_station",
  depot: "transport_depot",
  pickup: "accessible_pickup_point",
  "care hub": "care_support_hub",
  "support hub": "care_support_hub",
};

export function inferCategory(
  name: string,
  hint?: string
): AccessPlaceCategory {
  const text = `${hint ?? ""} ${name}`.toLowerCase();
  for (const [key, cat] of Object.entries(CATEGORY_HINTS)) {
    if (text.includes(key)) return cat;
  }
  return "other";
}

export function mapPlacemarkToImportItem(mark: ParsedKmlPlacemark) {
  return {
    name: mark.name,
    description: mark.description,
    latitude: mark.latitude,
    longitude: mark.longitude,
    category: inferCategory(mark.name, mark.category),
    externalRef: mark.externalRef,
    rawData: mark as object,
  };
}
