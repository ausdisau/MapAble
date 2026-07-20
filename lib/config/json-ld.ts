import { getCanonicalPublicOrigin } from "@/lib/config/canonical-url";

export type JsonLdGraph = Record<string, unknown>;

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
    name: "MapAble",
    url: origin,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@mapable.com.au",
      areaServed: "AU",
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
      name: "MapAble",
      url: origin,
      potentialAction: {
        "@type": "SearchAction",
        target: `${origin}/provider-finder?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  };
}
