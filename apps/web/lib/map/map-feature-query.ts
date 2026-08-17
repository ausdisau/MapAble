import { entitiesToGeoJSON } from "@/lib/map/geojson";
import { MAP_LAYER_IDS } from "@/lib/map/map-layer-ids";
import type { MapPointEntity } from "@/lib/map/types";

export function providersToGeoJSON(
  providers: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    suburb?: string;
    state?: string;
  }>,
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const entities: MapPointEntity[] = providers.map((p) => ({
    id: p.id,
    kind: "provider",
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    subtitle:
      p.suburb && p.state ? `${p.suburb}, ${p.state}` : p.suburb ?? p.state,
    layerId: MAP_LAYER_IDS.providers,
  }));
  return entitiesToGeoJSON(entities);
}
