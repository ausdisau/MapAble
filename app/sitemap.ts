import type { MetadataRoute } from "next";

import { PROVIDERS } from "@/app/provider-finder/providers";
import { getCanonicalPublicOrigin } from "@/lib/config/canonical-url";
import { DEMO_ACCESS_PLACES } from "@/lib/demo/accessibility-places";
import { LOCAL_ACCESS_LOCATIONS } from "@/lib/demo/local-access-pages";
import { informationalSitemapPaths } from "@/lib/public/informational/routes";
import { buildLocalLandingSitemapParams } from "@/lib/seo/local-landing";

const baseUrl = getCanonicalPublicOrigin();

/**
 * Additional public marketing URLs beyond the informational GO-gate allowlist.
 * Informational allowlist paths are always sourced from
 * `lib/public/informational/routes.ts` so the release boundary cannot drift.
 */
const additionalPublicRoutes = [
  "/access",
  "/accessibility-map",
  "/providers",
  "/provider-finder",
  "/pricing",
  "/for-providers",
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
  // Programme explainers also come from INFORMATIONAL_RELEASE_ROUTES;
  // listed here only if needed beyond that inventory.
];

function uniqueSitemapPaths(): string[] {
  const fromInventory = informationalSitemapPaths();
  const merged = new Set<string>([...fromInventory, ...additionalPublicRoutes]);
  return [...merged];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries = uniqueSitemapPaths().map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: (route === "" ? "weekly" : "monthly") as
      | "weekly"
      | "monthly",
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

  const providerLocalEntries = buildLocalLandingSitemapParams(PROVIDERS).map(
    (entry) => ({
      url: `${baseUrl}/provider-finder/${entry.suburb}/${entry.service}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }),
  );

  return [
    ...staticEntries,
    ...placeEntries,
    ...localEntries,
    ...providerLocalEntries,
  ];
}
