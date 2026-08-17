import type { MetadataRoute } from "next";

import { getCanonicalPublicOrigin } from "@/lib/config/canonical-url";

const baseUrl = getCanonicalPublicOrigin();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/care",
          "/transport",
          "/employment",
          "/marketplace",
          "/foods",
          "/access",
          "/peer",
          "/telehealth",
          "/providers",
          "/provider-finder",
          "/resources",
          "/guides",
          "/help",
          "/about",
          "/pricing",
          "/contact",
          "/for-providers",
          "/privacy",
          "/terms",
          "/data-deletion",
          "/accessibility-statement",
        ],
        disallow: [
          "/admin",
          "/api",
          "/dashboard",
          "/provider",
          "/worker",
          "/driver",
          "/messages",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
