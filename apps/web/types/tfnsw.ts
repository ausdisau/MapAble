/** Minimal GeoJSON types for Live Traffic NSW responses */

export type GeoJsonPoint = {
  type: "Point";
  coordinates: [number, number];
};

export type GeoJsonLineString = {
  type: "LineString";
  coordinates: [number, number][];
};

export type GeoJsonGeometry = GeoJsonPoint | GeoJsonLineString | { type: string };

export type LiveTrafficFeature = {
  type: "Feature";
  geometry?: GeoJsonGeometry;
  properties?: Record<string, unknown>;
};

export type LiveTrafficFeatureCollection = {
  type: "FeatureCollection";
  rights?: { copyright?: string; licence?: string };
  layerName?: string;
  lastPublished?: number;
  features?: LiveTrafficFeature[];
};

export type LiveTrafficStatus = {
  status?: string;
  lastUpdated?: number;
  [key: string]: unknown;
};

export type TfnswHazardCategory =
  | "incident"
  | "fire"
  | "flood"
  | "alpine"
  | "majorevent"
  | "roadwork"
  | "floodalpine"
  | "all";

export type TfnswHazardState = "open" | "closed" | "all";

export type TrafficAdvisoryHazard = {
  id?: string;
  category?: string;
  headline?: string;
  subCategory?: string;
  lat: number;
  lng: number;
  distanceMetres?: number;
};

export type TrafficAdvisory = {
  source: "tfnsw_live_traffic";
  disclaimer: string;
  hazardCount: number;
  hazards: TrafficAdvisoryHazard[];
  fetchedAt: string;
};

export type TripPlannerDepartureParams = {
  stopId: string;
  itdDate?: string;
  itdTime?: string;
  platformId?: string;
};

export type TripPlannerStopFinderParams = {
  query: string;
  maxResults?: number;
};
