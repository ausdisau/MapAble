import { MAPABLE_LOGO_SRC, MAPABLE_SUPPORT_EMAIL } from "@/lib/brand/constants";
import { getCanonicalPublicOrigin } from "@/lib/config/canonical-url";

export type JsonLdGraph = Record<string, unknown>;

/** Australian Disability Ltd — legal operator of MapAble. */
export const AUSTRALIAN_DISABILITY_LTD_ABN = "55 641 613 541";
export const AUSTRALIAN_DISABILITY_LTD_ABN_COMPACT = "55641613541";
export const AUSTRALIAN_DISABILITY_LTD_LEGAL_NAME = "Australian Disability Ltd";

/**
 * Serialize JSON-LD for inline `<script type="application/ld+json">`.
 * Escapes characters that can break out of or alter an HTML script context.
 */
export function serializeJsonLdForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Verified MapAble-specific external profile URLs for Organization.sameAs.
 * Leave empty until each URL is confirmed as an owned MapAble profile.
 * Do not use generic social-network homepages.
 */
export const VERIFIED_ORGANIZATION_SAME_AS: readonly string[] = [];

/** Organization + WebSite JSON-LD using the canonical public origin. */
export function buildPublicJsonLd(env: NodeJS.ProcessEnv = process.env): {
  organization: JsonLdGraph;
  website: JsonLdGraph;
} {
  const origin = getCanonicalPublicOrigin(env);

  const organization: JsonLdGraph = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: AUSTRALIAN_DISABILITY_LTD_LEGAL_NAME,
    legalName: AUSTRALIAN_DISABILITY_LTD_LEGAL_NAME,
    alternateName: ["MapAble", "MapAble Australia"],
    url: origin,
    logo: {
      "@type": "ImageObject",
      url: `${origin}${MAPABLE_LOGO_SRC}`,
    },
    image: `${origin}${MAPABLE_LOGO_SRC}`,
    taxID: AUSTRALIAN_DISABILITY_LTD_ABN_COMPACT,
    identifier: {
      "@type": "PropertyValue",
      name: "ABN",
      value: AUSTRALIAN_DISABILITY_LTD_ABN,
    },
    description:
      "MapAble Australia helps people find accessible places, NDIS providers, and inclusive community supports across Australia.",
    areaServed: {
      "@type": "Country",
      name: "Australia",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: MAPABLE_SUPPORT_EMAIL,
      areaServed: "AU",
      availableLanguage: ["en-AU", "en"],
    },
  };

  if (VERIFIED_ORGANIZATION_SAME_AS.length > 0) {
    organization.sameAs = [...VERIFIED_ORGANIZATION_SAME_AS];
  }

  return {
    organization,
    website: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      name: "MapAble Australia",
      alternateName: "MapAble",
      url: origin,
      description:
        "Discover accessible places, NDIS providers, and inclusive community services with MapAble Australia.",
      publisher: { "@id": `${origin}/#organization` },
      inLanguage: "en-AU",
      potentialAction: {
        "@type": "SearchAction",
        target: `${origin}/provider-finder?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  };
}
