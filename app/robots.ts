import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mapable.com.au";

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
