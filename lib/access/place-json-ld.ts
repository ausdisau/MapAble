/**
 * Schema.org Place / LocalBusiness JSON-LD for accessibility features.
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
  lastChecked?: string;
};

export function buildPlaceAccessibilityJsonLd(
  input: PlaceAccessibilityJsonLdInput,
): Record<string, unknown> {
  const amenityFeatures: string[] = [];
  if (input.stepFreeEntry) amenityFeatures.push("StepFreeEntrance");
  if (input.accessibleToilet) amenityFeatures.push("AccessibleToilet");
  if (input.accessibleParking) amenityFeatures.push("AccessibleParking");
  if (input.hearingLoop) amenityFeatures.push("HearingLoop");
  if (input.doorWidthMm != null) {
    amenityFeatures.push(`DoorClearWidthMm:${input.doorWidthMm}`);
  }

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["Place", "LocalBusiness"],
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
