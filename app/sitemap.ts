import type { MetadataRoute } from "next";

import { getCanonicalPublicOrigin } from "@/lib/config/canonical-url";
import { DEMO_ACCESS_PLACES } from "@/lib/demo/accessibility-places";
import { LOCAL_ACCESS_LOCATIONS } from "@/lib/demo/local-access-pages";

const baseUrl = getCanonicalPublicOrigin();

const publicRoutes = [
  "",
  "/care",
  "/transport",
  "/employment",
  "/marketplace",
  "/foods",
  "/access",
  "/accessibility-map",
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
  "/journey-planner",
  "/compare",
  "/mapping-days",
  "/add-access-info",
  "/verify-my-venue",
  "/provider-growth",
  "/access-intelligence",
  "/access-pass",
  "/peer",
  "/telehealth",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries = publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: (route === "" ? "weekly" : "monthly") as "weekly" | "monthly",
    priority: route === "" ? 1 : 0.7,
  }));

  const placeEntries = DEMO_ACCESS_PLACES.map((place) => ({
    url: `${baseUrl}/accessibility-map/${place.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const localEntries = LOCAL_ACCESS_LOCATIONS.map((location) => ({
    url: `${baseUrl}/access/${location.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  return [...staticEntries, ...placeEntries, ...localEntries];
}
