import type { AccessRatingCategory, AccessRatingValue } from "@prisma/client";

import { RATING_VALUE_SCORE } from "@/lib/access/search/access-ranking-service";

export function ratingValueToScore(value: AccessRatingValue): number | null {
  const s = RATING_VALUE_SCORE[value];
  return s > 0 ? s : null;
}

export const RATING_CATEGORIES: AccessRatingCategory[] = [
  "accessible_parking",
  "public_transport_dropoff",
  "path_to_entrance",
  "main_entrance",
  "doorway",
  "internal_movement",
  "ramps_lifts",
  "service_counter",
  "seating_furniture",
  "accessible_toilet",
  "ambulant_toilet",
  "signage",
  "hearing_access",
  "lighting_acoustics",
  "online_information",
  "staff_training",
  "service_access",
];
