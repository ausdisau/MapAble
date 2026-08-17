import { XMLParser } from "fast-xml-parser";
import { safeFetchText } from "./safe-fetch";

export interface ParsedFeature {
  name: string;
  description?: string;
  geometry: { type: "Point" | "LineString" | "Polygon" | "MultiLineString" | "MultiPolygon"; coordinates: any };
  attributes: Record<string, any>;
  externalId?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  cdataPropName: "__cdata",
  trimValues: true,
});

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function parseCoordString(raw: string): number[][] {
  // KML coords: "lng,lat,alt lng,lat,alt ..." separated by whitespace
  return raw
    .trim()
    .split(/\s+/)
    .map((tuple) => tuple.split(",").map(Number))
    .filter((c) => c.length >= 2 && !Number.isNaN(c[0]) && !Number.isNaN(c[1]))
    .map((c) => [c[0], c[1]]);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// Extract key/value pairs out of the bespoke description tables used in the KML
// (e.g. all-abilities-playgrounds uses an HTML table of <td>Key</td><td>Value</td>).
function attributesFromDescriptionHtml(html: string): Record<string, any> {
  const attrs: Record<string, any> = {};
  const rowRegex = /<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/gi;
  let m: RegExpExecArray | null;
  while ((m = rowRegex.exec(html)) !== null) {
    const key = stripHtml(m[1]);
    const val = stripHtml(m[2]);
    if (key && val && key.length < 40) attrs[key] = val;
  }
  return attrs;
}

function attributesFromExtendedData(ext: any): Record<string, any> {
  const attrs: Record<string, any> = {};
  if (!ext) return attrs;
  // <SchemaData><SimpleData name="x">val</SimpleData>
  const schemaData = ext.SchemaData;
  for (const sd of asArray(schemaData)) {
    for (const simple of asArray(sd?.SimpleData)) {
      const name = simple?.["@_name"];
      const value = simple?.["#text"] ?? simple;
      if (name && value !== undefined && typeof value !== "object") attrs[name] = value;
    }
  }
  // <Data name="x"><value>val</value></Data>
  for (const d of asArray(ext.Data)) {
    const name = d?.["@_name"];
    const value = d?.value?.["#text"] ?? d?.value;
    if (name && value !== undefined) attrs[name] = value;
  }
  return attrs;
}

function geometryFromPlacemark(pm: any): ParsedFeature["geometry"] | null {
  if (pm.Point?.coordinates) {
    const coords = parseCoordString(String(pm.Point.coordinates?.["#text"] ?? pm.Point.coordinates));
    if (coords[0]) return { type: "Point", coordinates: coords[0] };
  }
  if (pm.LineString?.coordinates) {
    const coords = parseCoordString(String(pm.LineString.coordinates?.["#text"] ?? pm.LineString.coordinates));
    if (coords.length >= 2) return { type: "LineString", coordinates: coords };
  }
  if (pm.Polygon) {
    const outer = pm.Polygon.outerBoundaryIs?.LinearRing?.coordinates;
    if (outer) {
      const ring = parseCoordString(String(outer?.["#text"] ?? outer));
      if (ring.length >= 3) return { type: "Polygon", coordinates: [ring] };
    }
  }
  if (pm.MultiGeometry) {
    const lines: number[][][] = [];
    for (const ls of asArray(pm.MultiGeometry.LineString)) {
      const coords = parseCoordString(String(ls.coordinates?.["#text"] ?? ls.coordinates));
      if (coords.length >= 2) lines.push(coords);
    }
    if (lines.length === 1) return { type: "LineString", coordinates: lines[0] };
    if (lines.length > 1) return { type: "MultiLineString", coordinates: lines };
  }
  return null;
}

function collectPlacemarks(node: any, acc: any[]) {
  if (!node || typeof node !== "object") return;
  for (const pm of asArray(node.Placemark)) acc.push(pm);
  for (const folder of asArray(node.Folder)) collectPlacemarks(folder, acc);
  for (const doc of asArray(node.Document)) collectPlacemarks(doc, acc);
}

function collectNetworkLinks(node: any, acc: string[]) {
  if (!node || typeof node !== "object") return;
  for (const nl of asArray(node.NetworkLink)) {
    const href = nl?.Link?.href ?? nl?.Url?.href;
    if (href) acc.push(String(href?.["#text"] ?? href));
  }
  for (const folder of asArray(node.Folder)) collectNetworkLinks(folder, acc);
  for (const doc of asArray(node.Document)) collectNetworkLinks(doc, acc);
}

export interface KmlParseResult {
  features: ParsedFeature[];
  networkLinks: string[];
}

export function parseKml(xml: string): KmlParseResult {
  const json = parser.parse(xml);
  const kml = json.kml ?? json;
  const placemarks: any[] = [];
  collectPlacemarks(kml, placemarks);
  const networkLinks: string[] = [];
  collectNetworkLinks(kml, networkLinks);

  const features: ParsedFeature[] = [];
  for (const pm of placemarks) {
    const geometry = geometryFromPlacemark(pm);
    if (!geometry) continue;
    const name = String(pm.name?.["#text"] ?? pm.name ?? "Unnamed").trim();

    let attributes = attributesFromExtendedData(pm.ExtendedData);
    let descriptionText: string | undefined;
    const rawDesc = pm.description?.__cdata ?? pm.description?.["#text"] ?? pm.description;
    if (rawDesc) {
      const descStr = String(rawDesc);
      if (/<\/?[a-z]/i.test(descStr)) {
        const tableAttrs = attributesFromDescriptionHtml(descStr);
        attributes = { ...tableAttrs, ...attributes };
        descriptionText = attributes["Playground"] || attributes["Facilities"] || undefined;
      } else {
        descriptionText = descStr.trim();
      }
    }

    const externalId = attributes["ID"] || attributes["OBJECTID"] || attributes["FID"] || undefined;
    features.push({
      name,
      description: descriptionText,
      geometry,
      attributes,
      externalId: externalId ? String(externalId) : undefined,
    });
  }

  return { features, networkLinks };
}

export function parseGeoJson(text: string): ParsedFeature[] {
  const data = JSON.parse(text);
  const collection = data.type === "FeatureCollection" ? data.features : [data];
  const features: ParsedFeature[] = [];
  for (const f of collection) {
    const geom = f.geometry || f;
    if (!geom?.type || !geom?.coordinates) continue;
    const props = f.properties || {};
    features.push({
      name: String(props.name || props.Name || props.title || "Unnamed"),
      description: props.description || props.Description,
      geometry: geom,
      attributes: props,
      externalId: props.id ? String(props.id) : undefined,
    });
  }
  return features;
}

// Auto-detect format and parse. NetworkLinks are resolved by fetching their KML.
export async function parseGeoFile(content: string, opts?: { resolveNetworkLinks?: boolean }): Promise<ParsedFeature[]> {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return parseGeoJson(trimmed);
  }
  const { features, networkLinks } = parseKml(trimmed);
  if (opts?.resolveNetworkLinks && networkLinks.length > 0 && features.length === 0) {
    const resolved: ParsedFeature[] = [];
    for (const url of networkLinks) {
      try {
        const text = await safeFetchText(url);
        resolved.push(...(await parseGeoFile(text, opts)));
      } catch {
        // skip unreachable/unsafe network links — explicit empty, no silent data fabrication
      }
    }
    return resolved;
  }
  return features;
}

export async function fetchAndParseUrl(url: string): Promise<ParsedFeature[]> {
  const text = await safeFetchText(url);
  return parseGeoFile(text, { resolveNetworkLinks: true });
}
