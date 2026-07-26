import { serializeJsonLdForScript } from "@/lib/config/json-ld";

export type LocalBusinessSchemaAccessibility = {
  wheelchairAccess?: boolean;
  stepFreeEntry?: boolean;
  accessibleToilet?: boolean;
  accessibleParking?: boolean;
  hearingLoop?: boolean;
  auslan?: boolean;
};

export type LocalBusinessSchemaProps = {
  name: string;
  service: string;
  suburb: string;
  state?: string;
  postcode?: string;
  /** Absolute canonical URL for this listing or local landing deep link. */
  url: string;
  description?: string;
  telephone?: string;
  rating?: number;
  reviewCount?: number;
  latitude?: number | null;
  longitude?: number | null;
  ndisRegistered?: boolean;
  accessibilityFeatures?: LocalBusinessSchemaAccessibility;
  /** Optional CSP nonce. */
  nonce?: string;
};

function buildAmenityFeatures(
  features: LocalBusinessSchemaAccessibility | undefined,
): Array<{ "@type": "LocationFeatureSpecification"; name: string; value: true }> {
  if (!features) return [];
  const out: Array<{
    "@type": "LocationFeatureSpecification";
    name: string;
    value: true;
  }> = [];
  if (features.wheelchairAccess) {
    out.push({
      "@type": "LocationFeatureSpecification",
      name: "WheelchairAccessible",
      value: true,
    });
  }
  if (features.stepFreeEntry) {
    out.push({
      "@type": "LocationFeatureSpecification",
      name: "StepFreeEntrance",
      value: true,
    });
  }
  if (features.accessibleToilet) {
    out.push({
      "@type": "LocationFeatureSpecification",
      name: "AccessibleToilet",
      value: true,
    });
  }
  if (features.accessibleParking) {
    out.push({
      "@type": "LocationFeatureSpecification",
      name: "AccessibleParking",
      value: true,
    });
  }
  if (features.hearingLoop) {
    out.push({
      "@type": "LocationFeatureSpecification",
      name: "HearingLoop",
      value: true,
    });
  }
  if (features.auslan) {
    out.push({
      "@type": "LocationFeatureSpecification",
      name: "AuslanAvailable",
      value: true,
    });
  }
  return out;
}

/**
 * Google-oriented LocalBusiness (+ AggregateRating) JSON-LD for aggregator listings.
 * Facility / access attributes are expressed as amenityFeature where known.
 */
export function buildLocalBusinessSchemaGraph(
  props: Omit<LocalBusinessSchemaProps, "nonce">,
): Record<string, unknown> {
  const rating =
    typeof props.rating === "number" && Number.isFinite(props.rating)
      ? Math.max(0, Math.min(5, props.rating))
      : null;
  const reviewCount =
    typeof props.reviewCount === "number" && props.reviewCount > 0
      ? Math.floor(props.reviewCount)
      : 0;

  const graph: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": props.ndisRegistered
      ? ["LocalBusiness", "MedicalBusiness"]
      : "LocalBusiness",
    name: props.name,
    url: props.url,
    description:
      props.description ??
      `${props.name} offers ${props.service} in ${props.suburb}. Listed on MapAble Australia’s facility-first NDIS provider directory.`,
    address: {
      "@type": "PostalAddress",
      addressLocality: props.suburb,
      addressRegion: props.state,
      postalCode: props.postcode,
      addressCountry: "AU",
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: props.suburb,
    },
    knowsAbout: [props.service, "NDIS", "accessible places", "inclusive community"],
  };

  if (props.telephone) graph.telephone = props.telephone;

  if (props.latitude != null && props.longitude != null) {
    graph.geo = {
      "@type": "GeoCoordinates",
      latitude: props.latitude,
      longitude: props.longitude,
    };
  }

  if (rating != null && reviewCount > 0) {
    graph.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(rating.toFixed(1)),
      bestRating: 5,
      worstRating: 1,
      reviewCount,
      ratingCount: reviewCount,
    };
  }

  const amenityFeature = buildAmenityFeatures(props.accessibilityFeatures);
  if (amenityFeature.length > 0) {
    graph.amenityFeature = amenityFeature;
  }

  if (props.ndisRegistered != null) {
    graph.additionalProperty = [
      {
        "@type": "PropertyValue",
        name: "ndisRegistered",
        value: props.ndisRegistered ? "true" : "false",
      },
    ];
  }

  return graph;
}

/**
 * Reusable LocalBusiness / AggregateRating schema injector for provider cards
 * and programmatic local SEO landings.
 */
export function LocalBusinessSchema(props: LocalBusinessSchemaProps) {
  const { nonce, ...data } = props;
  const graph = buildLocalBusinessSchemaGraph(data);

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: serializeJsonLdForScript(graph),
      }}
    />
  );
}
