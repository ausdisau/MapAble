import { getCanonicalPublicOrigin } from "@/lib/config/canonical-url";

export type JsonLdGraph = Record<string, unknown>;

/** Organization + WebSite JSON-LD using the Wave 0 canonical origin. */
export function buildPublicJsonLd(env: NodeJS.ProcessEnv = process.env): {
  organization: JsonLdGraph;
  website: JsonLdGraph;
} {
  const origin = getCanonicalPublicOrigin(env);

  return {
    organization: {
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
      sameAs: [origin],
    },
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
