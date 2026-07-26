import type { ParsedKmlPlacemark } from "@/lib/access/import/kml-parser-service";

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export interface GeoJsonFeature {
  type: "Feature";
  geometry?: {
    type: string;
    coordinates?: number[] | number[][] | number[][][];
  };
  properties?: Record<string, unknown>;
  id?: string | number;
}

function propsString(props: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const v = props[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pointFromGeometry(
  geometry: GeoJsonFeature["geometry"]
): { lat: number; lng: number } | null {
  if (!geometry || geometry.type !== "Point" || !Array.isArray(geometry.coordinates)) {
    return null;
  }
  const coords = geometry.coordinates;
  if (coords.length < 2) return null;
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

/** Parse merged accessible locations GeoJSON (e.g. accessible_locations_merged.geojson). */
export function parseAccessibleLocationsGeoJson(
  raw: string
): { placemarks: ParsedKmlPlacemark[]; errors: string[] } {
  const errors: string[] = [];
  let doc: GeoJsonFeatureCollection;

  try {
    doc = JSON.parse(raw) as GeoJsonFeatureCollection;
  } catch {
    return { placemarks: [], errors: ["Invalid JSON"] };
  }

  if (doc.type !== "FeatureCollection" || !Array.isArray(doc.features)) {
    return { placemarks: [], errors: ["Expected FeatureCollection"] };
  }

  const placemarks: ParsedKmlPlacemark[] = [];

  for (const feature of doc.features) {
    if (feature.type !== "Feature") continue;
    const props = feature.properties ?? {};
    const name =
      propsString(props, ["name", "Name", "title", "TITLE", "place_name"]) ??
      "Unnamed place";
    const description = propsString(props, [
      "description",
      "Description",
      "notes",
      "address",
      "Address",
    ]);
    const category = propsString(props, ["category", "Category", "type", "TYPE"]);
    const coords = pointFromGeometry(feature.geometry);
    if (!coords) {
      errors.push(`Skipped non-point feature: ${name}`);
      continue;
    }

    const externalRef =
      feature.id != null
        ? String(feature.id)
        : propsString(props, ["id", "ID", "fid", "source_id"]);

    placemarks.push({
      name,
      description,
      category,
      latitude: coords.lat,
      longitude: coords.lng,
      externalRef,
    });
  }

  return { placemarks, errors };
}
