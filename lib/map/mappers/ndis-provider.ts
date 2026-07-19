import type { Provider } from "@/app/provider-finder/providers";
import type { NdisProviderSearchRow } from "@/lib/ingestion/ndis-providers-search";
import { entitiesToGeoJSON } from "@/lib/map/geojson";
import { MAP_LAYER_IDS } from "@/lib/map/map-layer-ids";
import type { MapPointEntity } from "@/lib/map/types";

const AU_STATES = new Set([
  "NSW",
  "VIC",
  "QLD",
  "WA",
  "SA",
  "TAS",
  "ACT",
  "NT",
]);

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function normaliseState(state: string | null): Provider["state"] {
  const upper = (state ?? "").trim().toUpperCase();
  if (AU_STATES.has(upper)) return upper as Provider["state"];
  return "NSW";
}

export function ndisRowHasCoordinates(
  row: Pick<NdisProviderSearchRow, "latitude" | "longitude">,
): boolean {
  return (
    row.latitude != null &&
    row.longitude != null &&
    row.latitude !== 0 &&
    row.longitude !== 0
  );
}

export function ndisRowToMapPointEntity(
  row: NdisProviderSearchRow,
): MapPointEntity | null {
  if (!ndisRowHasCoordinates(row)) return null;
  const suburb = row.suburb ?? "";
  const state = row.state ?? "";
  return {
    id: row.source_id,
    kind: "provider",
    name: row.provider_name,
    lat: row.latitude!,
    lng: row.longitude!,
    subtitle: [suburb, state].filter(Boolean).join(", ") || undefined,
    layerId: MAP_LAYER_IDS.providers,
  };
}

export function ndisRowsToMapGeoJSON(rows: NdisProviderSearchRow[]) {
  const entities = rows
    .map(ndisRowToMapPointEntity)
    .filter((e): e is MapPointEntity => e != null);
  return entitiesToGeoJSON(entities);
}

/** Map NDIS search row to Provider Finder card shape (coords optional). */
export function ndisRowToProvider(row: NdisProviderSearchRow): Provider {
  const slug = slugifyName(row.provider_name) || row.source_id;
  return {
    id: row.source_id,
    slug,
    name: row.provider_name,
    suburb: row.suburb ?? "—",
    state: normaliseState(row.state),
    postcode: row.postcode ?? "",
    distanceKm: 0,
    rating: 0,
    reviewCount: 0,
    registered: row.registration_groups.length > 0,
    categories: row.services.slice(0, 8),
    supports: ["In-person"],
    latitude: ndisRowHasCoordinates(row) ? row.latitude! : undefined,
    longitude: ndisRowHasCoordinates(row) ? row.longitude! : undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
  };
}
