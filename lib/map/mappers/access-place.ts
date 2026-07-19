import { entitiesToGeoJSON } from "@/lib/map/geojson";
import { MAP_LAYER_IDS } from "@/lib/map/map-layer-ids";
import type { MapPointEntity } from "@/lib/map/types";

export type AccessPlaceMapInput = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  subtitle?: string;
};

export function accessPlaceToMapPointEntity(
  place: AccessPlaceMapInput,
): MapPointEntity {
  return {
    id: place.id,
    kind: "access_place",
    name: place.name,
    lat: place.latitude,
    lng: place.longitude,
    subtitle: place.subtitle,
    layerId: MAP_LAYER_IDS.accessPlaces,
  };
}

export function accessPlacesToMapGeoJSON(places: AccessPlaceMapInput[]) {
  return entitiesToGeoJSON(places.map(accessPlaceToMapPointEntity));
}
