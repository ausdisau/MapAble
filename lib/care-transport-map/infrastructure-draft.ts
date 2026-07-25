import { z } from "zod";

import { accessPlaceCategorySchema } from "@/types/access-map";

export const infrastructureDraftRequestSchema = z.object({
  description: z.string().trim().min(8).max(2000),
});

export const infrastructureDraftSchema = z.object({
  name: z.string().min(2).max(200),
  category: accessPlaceCategorySchema,
  addressText: z.string().max(500).optional(),
  suburb: z.string().max(120).optional(),
  stateOrRegion: z.string().max(80).optional(),
  description: z.string().max(5000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  geocodeQuery: z.string().max(300).optional(),
});

export type InfrastructureDraft = z.infer<typeof infrastructureDraftSchema>;

const INFRA_CATEGORIES = [
  "care_support_hub",
  "accessible_pickup_point",
  "transport_depot",
  "transport_station",
  "health_service",
  "community_centre",
] as const;

function inferCategory(
  text: string,
): (typeof INFRA_CATEGORIES)[number] | "other" {
  const t = text.toLowerCase();
  if (/\b(depot|garage|fleet)\b/.test(t)) return "transport_depot";
  if (/\b(pickup|drop[- ]?off|kerbside)\b/.test(t)) {
    return "accessible_pickup_point";
  }
  if (/\b(station|bus|train|ferry|tram)\b/.test(t)) return "transport_station";
  if (/\b(care|support\s*hub|day\s*program|respite)\b/.test(t)) {
    return "care_support_hub";
  }
  if (/\b(clinic|health|gp|hospital|allied)\b/.test(t)) return "health_service";
  if (/\b(community\s*centre|neighbourhood)\b/.test(t)) {
    return "community_centre";
  }
  return "care_support_hub";
}

function extractName(text: string): string {
  const quoted = text.match(/[“"]([^”"]{2,120})[”"]/);
  if (quoted?.[1]) return quoted[1].trim();

  const called = text.match(
    /\b(?:called|named|name is)\s+([A-Z][\w'’\- ]{1,80})/,
  );
  if (called?.[1]) return called[1].trim();

  const firstSentence = text.split(/[.!?]/)[0]?.trim() ?? text.trim();
  if (firstSentence.length <= 80) return firstSentence;
  return `${firstSentence.slice(0, 77)}…`;
}

function extractSuburbState(text: string): {
  suburb?: string;
  stateOrRegion?: string;
  addressText?: string;
} {
  const stateMatch = text.match(
    /\b(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\b/i,
  );
  const stateOrRegion = stateMatch?.[1]?.toUpperCase();

  const suburbMatch = text.match(
    /\bin\s+([A-Z][a-zA-Z'’\-]+(?:\s+[A-Z][a-zA-Z'’\-]+){0,2})(?=\s+(?:NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\b|[,\s]|$)/,
  );
  let suburb = suburbMatch?.[1]?.trim();
  if (suburb) {
    suburb = suburb
      .replace(/\s+(?:NSW|VIC|QLD|WA|SA|TAS|ACT|NT)$/i, "")
      .trim();
  }

  const addressMatch = text.match(
    /\bat\s+(\d+[A-Za-z]?\s+[^,.]+(?:,\s*[^,.]+)?)/i,
  );

  return {
    suburb,
    stateOrRegion,
    addressText: addressMatch?.[1]?.trim(),
  };
}

/** Deterministic draft fill used when GPT interpreter is unavailable. */
export function draftInfrastructureFromDescription(
  description: string,
): InfrastructureDraft {
  const location = extractSuburbState(description);
  const category = inferCategory(description);
  const name = extractName(description);
  const geocodeParts = [
    location.addressText,
    location.suburb,
    location.stateOrRegion,
    "Australia",
  ].filter(Boolean);

  return infrastructureDraftSchema.parse({
    name,
    category,
    addressText: location.addressText,
    suburb: location.suburb,
    stateOrRegion: location.stateOrRegion,
    description: description.trim(),
    geocodeQuery: geocodeParts.join(", "),
  });
}
