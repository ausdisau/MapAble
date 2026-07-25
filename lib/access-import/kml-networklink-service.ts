import { MAX_ALLOWLISTED_KML_BYTES } from "@/lib/access-import/import-limits";
import { parseKmlXml } from "@/lib/access-import/kml-parser-service";
import { MAPABLE_MY_MAPS_KML_URL } from "@/lib/access-map/copy";
import {
  isAllowlistedMapableMyMapsUrl,
  resolveMapableMyMapsKmlUrl,
} from "@/lib/access-map/mapable-my-maps-url";

export function isAllowlistedNetworkLinkUrl(url: string): boolean {
  return isAllowlistedMapableMyMapsUrl(url);
}

/** Resolve share/edit/viewer URLs to the force-KML export URL before fetch. */
export function toFetchableAllowlistedKmlUrl(url: string): string {
  return resolveMapableMyMapsKmlUrl(url) ?? url;
}

export async function fetchAllowlistedKml(url: string): Promise<string> {
  if (!isAllowlistedNetworkLinkUrl(url)) {
    throw new Error("NetworkLink URL is not on the allowlist");
  }

  const fetchUrl = toFetchableAllowlistedKmlUrl(url);
  if (!isAllowlistedNetworkLinkUrl(fetchUrl)) {
    throw new Error("Resolved KML URL is not on the allowlist");
  }

  const res = await fetch(fetchUrl, {
    headers: {
      Accept: "application/vnd.google-earth.kml+xml, application/xml, text/xml",
    },
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch KML: ${res.status}`);
  }

  const text = await res.text();
  if (text.length > MAX_ALLOWLISTED_KML_BYTES) {
    throw new Error("KML response too large");
  }
  return text;
}

export async function resolveKmlDocument(xml: string) {
  const doc = parseKmlXml(xml);
  if (doc.placemarks.length > 0) return doc;

  if (doc.networkLinkHref && isAllowlistedNetworkLinkUrl(doc.networkLinkHref)) {
    const nested = await fetchAllowlistedKml(doc.networkLinkHref);
    const parsed = parseKmlXml(nested);
    return {
      ...parsed,
      // Preserve the allowlisted href that was resolved (nested docs omit it).
      networkLinkHref:
        resolveMapableMyMapsKmlUrl(doc.networkLinkHref) ??
        doc.networkLinkHref ??
        MAPABLE_MY_MAPS_KML_URL,
    };
  }

  return doc;
}
