/** Entity kinds rendered on MapAble maps. */
export type MapEntityKind =
  | "provider"
  | "access_place"
  | "user"
  | "care_provider"
  | "transport_infra"
  | "trip_point";

export type MapPointEntity = {
  id: string;
  kind: MapEntityKind;
  name: string;
  lat: number;
  lng: number;
  subtitle?: string;
  layerId?: string;
};

export type MapPointFeatureProperties = {
  kind: MapEntityKind;
  id: string;
  name: string;
  subtitle?: string;
  layerId?: string;
};

export type MapPointFeature = GeoJSON.Feature<
  GeoJSON.Point,
  MapPointFeatureProperties
>;

export type MapFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  MapPointFeatureProperties
>;
