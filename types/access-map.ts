import { z } from "zod";

export const accessPlaceCategorySchema = z.enum([
  "cafe_restaurant",
  "bar_pub",
  "shop",
  "shopping_centre",
  "park",
  "beach",
  "library",
  "museum_gallery",
  "theatre_cinema",
  "sports_venue",
  "community_centre",
  "health_service",
  "education",
  "transport_station",
  "public_toilet",
  "accommodation",
  "tourism_attraction",
  "government_service",
  "care_support_hub",
  "accessible_pickup_point",
  "transport_depot",
  "other",
]);

export const createAccessPlaceSchema = z.object({
  name: z.string().min(2).max(200),
  category: accessPlaceCategorySchema.default("other"),
  description: z.string().max(5000).optional(),
  addressText: z.string().max(500).optional(),
  suburb: z.string().max(120).optional(),
  stateOrRegion: z.string().max(80).optional(),
  country: z.string().max(2).default("AU"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  features: z
    .array(
      z.enum([
        "step_free_entry",
        "accessible_parking",
        "accessible_toilet",
        "changing_places",
        "lift_access",
        "ramp_access",
        "wide_doorways",
        "wide_paths",
        "hearing_loop",
        "braille_tactile_signage",
        "quiet_space",
        "low_sensory_environment",
        "assistance_animals_welcome",
        "accessible_dropoff",
        "public_transport_nearby",
      ])
    )
    .optional(),
});

export const venueClaimSchema = z.object({
  businessName: z.string().min(1).max(200).optional(),
  evidenceNote: z.string().max(2000).optional(),
});

export const reportPlaceSchema = z.object({
  reason: z.enum([
    "inaccurate_access_information",
    "abusive_or_harassing",
    "private_information",
    "defamatory_or_unverified_claim",
    "unsafe_advice",
    "spam",
    "duplicate_place",
    "closed_or_moved_place",
    "other",
  ]),
  details: z.string().max(2000).optional(),
});

export const accessSearchQuerySchema = z.object({
  q: z.string().optional(),
  category: accessPlaceCategorySchema.optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().min(0.1).max(200).optional(),
  suburb: z.string().optional(),
  state: z.string().optional(),
  features: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v): string[] | undefined => {
      if (!v) return undefined;
      return Array.isArray(v) ? v : v.split(",").map((s) => s.trim());
    }),
  minCommunityRating: z.coerce.number().min(0).max(5).optional(),
  accreditationTier: z.enum(["not_accredited", "bronze", "silver", "gold"]).optional(),
  confidence: z
    .enum([
      "unknown",
      "user_reported",
      "multiple_user_reports",
      "venue_claimed",
      "mapable_verified",
      "mapable_accredited",
    ])
    .optional(),
  sort: z
    .enum([
      "relevance",
      "distance",
      "highest_user_rating",
      "most_reviewed",
      "recently_updated",
      "accredited_first",
    ])
    .default("relevance"),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const updateAccessPlaceSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  category: accessPlaceCategorySchema.optional(),
  description: z.string().max(5000).optional(),
  addressText: z.string().max(500).optional(),
  suburb: z.string().max(120).optional(),
  stateOrRegion: z.string().max(80).optional(),
  country: z.string().max(2).optional(),
});

export type CreateAccessPlaceInput = z.infer<typeof createAccessPlaceSchema>;
export type UpdateAccessPlaceInput = z.infer<typeof updateAccessPlaceSchema>;
