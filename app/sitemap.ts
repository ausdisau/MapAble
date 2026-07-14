import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mapable.com.au";

const publicRoutes = [
  "",
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
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
