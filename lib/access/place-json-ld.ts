/**
 * Schema.org Place / LocalBusiness / CivicStructure JSON-LD for accessibility features.
 * Values must already be public, non-sensitive place facts.
 */

export type PlaceAccessibilityJsonLdInput = {
  name: string;
  description?: string;
  url: string;
  suburb?: string;
  state?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  category?: string;
  doorWidthMm?: number | null;
  stepFreeEntry?: boolean | null;
  accessibleToilet?: boolean | null;
  accessibleParking?: boolean | null;
  hearingLoop?: boolean | null;
  rampSlopeRatio?: string | null;
  tactilePaving?: boolean | null;
  lastChecked?: string;
  /** Prefer CivicStructure for public venues (libraries, toilets, galleries). */
  civicStructure?: boolean;
};

const CIVIC_CATEGORIES = new Set([
  "library",
  "toilet",
  "public_toilet",
  "gallery",
  "gallery_venue",
  "civic",
]);

function resolveTypes(input: PlaceAccessibilityJsonLdInput): string[] {
  const types = new Set<string>(["Place"]);
  const category = (input.category || "").toLowerCase();
  const useCivic =
    input.civicStructure === true ||
    (input.civicStructure !== false && CIVIC_CATEGORIES.has(category));
  if (useCivic) {
    types.add("CivicStructure");
  } else {
    types.add("LocalBusiness");
  }
  return Array.from(types);
}

export function buildPlaceAccessibilityJsonLd(
  input: PlaceAccessibilityJsonLdInput,
): Record<string, unknown> {
  const amenityFeatures: string[] = [];
  if (input.stepFreeEntry) amenityFeatures.push("StepFreeEntrance");
  if (input.accessibleToilet) amenityFeatures.push("AccessibleToilet");
  if (input.accessibleParking) amenityFeatures.push("AccessibleParking");
  if (input.hearingLoop) amenityFeatures.push("HearingLoop");
  if (input.tactilePaving) amenityFeatures.push("TactilePaving");
  if (input.doorWidthMm != null) {
    amenityFeatures.push(`DoorClearWidthMm:${input.doorWidthMm}`);
  }
  if (input.rampSlopeRatio) {
    amenityFeatures.push(`RampSlopeRatio:${input.rampSlopeRatio}`);
  }

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": resolveTypes(input),
    name: input.name,
    url: input.url,
    description:
      input.description ??
      "Accessibility information published by MapAble for planning visits.",
    address: {
      "@type": "PostalAddress",
      addressLocality: input.suburb,
      addressRegion: input.state,
      addressCountry: input.country ?? "AU",
    },
    additionalProperty: amenityFeatures.map((value) => ({
      "@type": "PropertyValue",
      name: "accessibilityFeature",
      value,
    })),
  };

  if (input.latitude != null && input.longitude != null) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: input.latitude,
      longitude: input.longitude,
    };
  }

  if (input.category) {
    jsonLd.additionalType = input.category;
  }

  if (input.lastChecked) {
    jsonLd.dateModified = input.lastChecked;
  }

  return jsonLd;
}

export function serializePlaceJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
