import { parseKmlXml } from "@/lib/access-import/kml-parser-service";
import { ACCESS_IMPORT_ALLOWLIST_URLS } from "@/lib/access-map/copy";

export function isAllowlistedNetworkLinkUrl(url: string): boolean {
  try {
    const normalized = new URL(url).toString();
    return ACCESS_IMPORT_ALLOWLIST_URLS.some((allowed) => allowed === normalized);
  } catch {
    return false;
  }
}

export async function fetchAllowlistedKml(url: string): Promise<string> {
  if (!isAllowlistedNetworkLinkUrl(url)) {
    throw new Error("NetworkLink URL is not on the allowlist");
  }

  const res = await fetch(url, {
    headers: { Accept: "application/vnd.google-earth.kml+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch KML: ${res.status}`);
  }

  const text = await res.text();
  if (text.length > 5_000_000) {
    throw new Error("KML response too large");
  }
  return text;
}

export async function resolveKmlDocument(xml: string) {
  const doc = parseKmlXml(xml);
  if (doc.placemarks.length > 0) return doc;

  if (doc.networkLinkHref && isAllowlistedNetworkLinkUrl(doc.networkLinkHref)) {
    const nested = await fetchAllowlistedKml(doc.networkLinkHref);
    return parseKmlXml(nested);
  }

  return doc;
}
