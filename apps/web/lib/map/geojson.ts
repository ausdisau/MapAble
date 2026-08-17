import type { MapFeatureCollection, MapPointEntity } from "@/lib/map/types";

export function entityToFeature(entity: MapPointEntity): MapFeatureCollection["features"][number] {
  return {
    type: "Feature",
    id: entity.id,
    geometry: {
      type: "Point",
      coordinates: [entity.lng, entity.lat],
    },
    properties: {
      kind: entity.kind,
      id: entity.id,
      name: entity.name,
      ...(entity.subtitle ? { subtitle: entity.subtitle } : {}),
      ...(entity.layerId ? { layerId: entity.layerId } : {}),
    },
  };
}

export function entitiesToGeoJSON(entities: MapPointEntity[]): MapFeatureCollection {
  return {
    type: "FeatureCollection",
    features: entities.map(entityToFeature),
  };
}
