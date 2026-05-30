export type GeoDomain = "accessibility" | "care" | "transport" | "employment";

export interface MapLayer {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  domains: string[];
  visibility: "public" | "staff" | "admin";
  icon?: string | null;
  color?: string | null;
  attribution?: string | null;
  sourceUrl?: string | null;
  geometryType: "Point" | "LineString" | "Polygon" | "MultiLineString" | "MultiPolygon";
  defaultVisible: boolean;
  ordering: number;
}

export interface MapFeature {
  id: string;
  layerId: string;
  categoryId?: string | null;
  name: string;
  description?: string | null;
  geometry: { type: string; coordinates: any };
  lat?: string | null;
  lng?: string | null;
  attributes?: Record<string, any> | null;
  source?: string | null;
  externalId?: string | null;
}

export interface MapCategory {
  id: string;
  slug: string;
  name: string;
  icon?: string | null;
  color?: string | null;
}

export interface PersonalPlace {
  id: string;
  userId: string;
  name: string;
  tag?: string | null;
  lat: string;
  lng: string;
  address?: string | null;
  notes?: string | null;
}

export interface GeocodeResult {
  name: string;
  lat: number;
  lng: number;
  type: string;
}

export interface ServiceRegion {
  id: string;
  name: string;
  organizationId?: string | null;
  geometry: { type: string; coordinates: any };
  notes?: string | null;
}

export interface WorkerCoverageZone {
  id: string;
  workerId: string;
  mode: string;
  geometry?: { type: string; coordinates: any } | null;
  suburbs?: string[] | null;
  centerLat?: string | null;
  centerLng?: string | null;
  radiusKm?: string | null;
  maxTravelMins?: number | null;
}

export interface GeoAIAction {
  type: "setDomain" | "toggleLayer" | "flyTo";
  domain?: GeoDomain;
  layerId?: string;
  layerSlug?: string;
  visible?: boolean;
  lat?: number;
  lng?: number;
  zoom?: number;
  label?: string;
}

export interface GeoAIResponse {
  reply: string;
  actions: GeoAIAction[];
}

export const DOMAIN_LABELS: Record<GeoDomain, string> = {
  accessibility: "Accessibility",
  care: "Care",
  transport: "Transport",
  employment: "Employment",
};
