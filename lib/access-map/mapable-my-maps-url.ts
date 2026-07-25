import {
  ACCESS_IMPORT_ALLOWLIST_URLS,
  MAPABLE_MY_MAPS_KML_URL,
} from "@/lib/access-map/copy";

/** Canonical MapAble Google My Maps document id. */
export const MAPABLE_MY_MAPS_MID = "1sx0iyF2RqJKO8maeZ_Sn_EvWVyybcrOI";

/**
 * Normalize Google My Maps viewer/edit/share/KML URLs for the allowlisted MapAble map.
 * Returns the force-KML export URL when the mid matches; otherwise null.
 */
export function resolveMapableMyMapsKmlUrl(input: string): string | null {
  try {
    const url = new URL(input.trim());
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "google.com" && host !== "maps.google.com") {
      return null;
    }

    const pathMid = url.pathname.match(
      /\/d\/(?:u\/\d+\/)?(?:edit|viewer|kml)\/([^/?#]+)/i
    )?.[1];
    const mid = url.searchParams.get("mid") ?? pathMid ?? null;

    if (!mid || mid !== MAPABLE_MY_MAPS_MID) {
      return null;
    }

    return MAPABLE_MY_MAPS_KML_URL;
  } catch {
    return null;
  }
}

export function isAllowlistedMapableMyMapsUrl(url: string): boolean {
  if (resolveMapableMyMapsKmlUrl(url)) return true;
  try {
    const normalized = new URL(url).toString();
    return ACCESS_IMPORT_ALLOWLIST_URLS.some((allowed) => allowed === normalized);
  } catch {
    return false;
  }
}
