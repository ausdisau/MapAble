import type { ResultCategory, SupportArea } from "@/lib/marketing/mapable-care-combined-data";
import type { SupportTypeId } from "@/lib/provider/finder/filters";

/** Public discovery entry points aligned with the combined homepage support areas. */
export const supportAreaLandingRoutes: Record<SupportArea, string> = {
  All: "/provider-finder",
  Care: "/provider-finder?area=Care",
  Transport: "/provider-finder?area=Transport",
  "NDIS Help": "/ask",
  Jobs: "/provider-finder?area=Jobs",
  Places: "/accessibility-map",
};

/** Maps marketing `area` query param to provider finder support type filter. */
export function supportAreaToSupportTypeId(area: string | null): SupportTypeId | null {
  switch (area) {
    case "Care":
      return "personal-care";
    case "Transport":
      return "transport";
    case "Jobs":
      return "employment";
    default:
      return null;
  }
}

export function buildGuidedSearchUrl(query: string, area: SupportArea): string {
  const trimmed = query.trim();

  if (area === "NDIS Help") {
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    const qs = params.toString();
    return qs ? `/ask?${qs}` : "/ask";
  }

  const params = new URLSearchParams();
  if (trimmed) params.set("q", trimmed);
  if (area !== "All") params.set("area", area);
  const qs = params.toString();
  return qs ? `/provider-finder?${qs}` : supportAreaLandingRoutes[area];
}

export function getSearchResultHref(category: ResultCategory): string {
  switch (category) {
    case "Plan":
      return "/provider-finder?area=Care";
    case "Care":
      return supportAreaLandingRoutes.Care;
    case "Transport":
      return supportAreaLandingRoutes.Transport;
    case "NDIS Help":
      return supportAreaLandingRoutes["NDIS Help"];
    case "Jobs":
      return supportAreaLandingRoutes.Jobs;
    case "Places":
      return supportAreaLandingRoutes.Places;
    case "Support":
      return "/ask";
    default:
      return "/provider-finder";
  }
}

/** Feature routes surfaced in marketing navigation and footer. */
export const marketingFeatureRoutes = {
  home: "/",
  providerFinder: "/provider-finder",
  ask: "/ask",
  access: "/access",
  register: "/register",
  login: "/login",
  dashboard: "/dashboard",
  dashboardEngagement: "/dashboard/engagement",
  providerConsole: "/provider",
  supportCoordinator: "/support-coordinator",
  /** Deferred Year-One — opt-in via MAPABLE_MARKETPLACE_ENABLED only. */
  marketplace: "/marketplace",
  employment: "/employment",
  privacy: "/privacy",
  terms: "/terms",
} as const;
