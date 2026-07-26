/** Configuration for the MapAble SDK client. */
export interface MapAbleConfig {
  /** API key used for Bearer authentication. */
  apiKey: string;
  /** Optional API base URL. Defaults to the MapAble production API host. */
  baseUrl?: string;
}

/** Mobility / accessibility profile used when planning indoor routes. */
export type MobilityProfile =
  | "standard"
  | "manual_wheelchair"
  | "power_wheelchair"
  | "sensory_sensitive";

/** A geographic point with optional indoor context. */
export interface RoutePoint {
  lat: number;
  lng: number;
  /** Floor identifier within a venue (e.g. "G", "1", "B1"). */
  floor?: string;
  /** Venue identifier when the point is indoors. */
  venueId?: string;
}

/** Optional preferences that influence indoor path planning. */
export interface RoutePreferences {
  /** Prefer step-free / elevator routes when true. */
  avoidStairs?: boolean;
  /** Prefer quieter corridors when true (sensory-friendly routing). */
  preferQuiet?: boolean;
  /** Maximum walking distance in meters, if constrained. */
  maxDistanceMeters?: number;
}

/** Request payload for indoor route planning. */
export interface RouteRequest {
  origin: RoutePoint;
  destination: RoutePoint;
  mobilityProfile: MobilityProfile;
  preferences?: RoutePreferences;
}

/** GeoJSON position: [longitude, latitude] or [longitude, latitude, elevation]. */
export type GeoJSONPosition = [number, number] | [number, number, number];

/** Minimal GeoJSON geometry union used by route responses. */
export type GeoJSONGeometry =
  | {
      type: "Point";
      coordinates: GeoJSONPosition;
    }
  | {
      type: "LineString";
      coordinates: GeoJSONPosition[];
    }
  | {
      type: "MultiLineString";
      coordinates: GeoJSONPosition[][];
    }
  | {
      type: "Polygon";
      coordinates: GeoJSONPosition[][];
    }
  | {
      type: "MultiPolygon";
      coordinates: GeoJSONPosition[][][];
    };

/** A single GeoJSON Feature. */
export interface GeoJSONFeature {
  type: "Feature";
  geometry: GeoJSONGeometry | null;
  properties: Record<string, unknown> | null;
  id?: string | number;
}

/** A GeoJSON FeatureCollection (e.g. planned indoor path geometry). */
export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}
