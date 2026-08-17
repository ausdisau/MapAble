import type { JsonLdGraph } from "@/lib/config/json-ld";

/**
 * Inputs for LocalBusiness / Service JSON-LD on provider or venue pages
 * (e.g. `/provider-finder`, `/care`, `/jonathan/profile/[slug]`).
 * Only pass public, non-sensitive facts.
 */
export type ProviderLocalBusinessJsonLdInput = {
  name: string;
  description?: string;
  /** Absolute canonical URL for this listing. */
  url: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  telephone?: string;
  email?: string;
  /** External provider website when distinct from MapAble profile URL. */
  sameAs?: string | string[];
  abn?: string;
  categories?: string[];
  ndisRegistered?: boolean;
  image?: string;
  priceRange?: string;
  areaServed?: string;
};

export type ProviderServiceJsonLdInput = {
  name: string;
  description?: string;
  /** Absolute URL for the service or profile page. */
  url: string;
  serviceType?: string | string[];
  areaServed?: string;
  providerName: string;
  providerUrl?: string;
  ndisRegistered?: boolean;
};

function normalizeAbn(abn: string): string {
  return abn.replace(/\s+/g, "");
}

/**
 * LocalBusiness (optionally HealthAndBeautyBusiness / ProfessionalService via additionalType)
 * for an NDIS / disability support provider listing.
 */
export function buildProviderLocalBusinessJsonLd(
  input: ProviderLocalBusinessJsonLdInput,
): JsonLdGraph {
  const types = ["LocalBusiness"];
  if (input.ndisRegistered) {
    types.push("MedicalBusiness");
  }

  const jsonLd: JsonLdGraph = {
    "@context": "https://schema.org",
    "@type": types.length === 1 ? types[0] : types,
    name: input.name,
    url: input.url,
    description:
      input.description ??
      `${input.name} — disability support and accessible community services listed on MapAble Australia.`,
    address: {
      "@type": "PostalAddress",
      addressLocality: input.suburb,
      addressRegion: input.state,
      postalCode: input.postcode,
      addressCountry: input.country ?? "AU",
    },
    areaServed: input.areaServed ?? "AU",
  };

  if (input.telephone) jsonLd.telephone = input.telephone;
  if (input.email) jsonLd.email = input.email;
  if (input.image) jsonLd.image = input.image;
  if (input.priceRange) jsonLd.priceRange = input.priceRange;

  if (input.latitude != null && input.longitude != null) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: input.latitude,
      longitude: input.longitude,
    };
  }

  if (input.sameAs) {
    jsonLd.sameAs = Array.isArray(input.sameAs)
      ? input.sameAs
      : [input.sameAs];
  }

  if (input.abn) {
    jsonLd.taxID = normalizeAbn(input.abn);
    jsonLd.identifier = {
      "@type": "PropertyValue",
      name: "ABN",
      value: input.abn.trim(),
    };
  }

  if (input.categories?.length) {
    jsonLd.knowsAbout = input.categories;
    jsonLd.additionalType = input.categories;
  }

  if (input.ndisRegistered != null) {
    jsonLd.additionalProperty = [
      {
        "@type": "PropertyValue",
        name: "ndisRegistered",
        value: input.ndisRegistered ? "true" : "false",
      },
    ];
  }

  return jsonLd;
}

/**
 * Service schema for a support category offered by a provider (therapy, transport, etc.).
 * Pair with LocalBusiness on the same page when useful.
 */
export function buildProviderServiceJsonLd(
  input: ProviderServiceJsonLdInput,
): JsonLdGraph {
  const jsonLd: JsonLdGraph = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    url: input.url,
    description:
      input.description ??
      `${input.name} for people seeking accessible places, NDIS providers, and inclusive community support.`,
    provider: {
      "@type": "LocalBusiness",
      name: input.providerName,
      ...(input.providerUrl ? { url: input.providerUrl } : {}),
    },
    areaServed: {
      "@type": "Country",
      name: input.areaServed ?? "Australia",
    },
  };

  if (input.serviceType) {
    jsonLd.serviceType = input.serviceType;
  }

  if (input.ndisRegistered != null) {
    jsonLd.additionalProperty = [
      {
        "@type": "PropertyValue",
        name: "ndisRegistered",
        value: input.ndisRegistered ? "true" : "false",
      },
    ];
  }

  return jsonLd;
}
