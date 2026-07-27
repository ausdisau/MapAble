import { apiRequest } from "@/lib/queryClient";
import type {
  MapLayer, MapFeature, MapCategory, PersonalPlace, GeocodeResult,
  ServiceRegion, WorkerCoverageZone, GeoAIResponse,
} from "./types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

export const geoApi = {
  getLayers: (domain?: string) =>
    getJson<MapLayer[]>(`/api/geo/layers${domain ? `?domain=${encodeURIComponent(domain)}` : ""}`),

  getFeatures: (params: { layerIds?: string[]; layerId?: string; q?: string; bbox?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params.layerId) qs.set("layerId", params.layerId);
    if (params.layerIds?.length) qs.set("layerIds", params.layerIds.join(","));
    if (params.q) qs.set("q", params.q);
    if (params.bbox) qs.set("bbox", params.bbox);
    if (params.limit) qs.set("limit", String(params.limit));
    return getJson<MapFeature[]>(`/api/geo/features?${qs.toString()}`);
  },

  getCategories: () => getJson<MapCategory[]>("/api/geo/categories"),

  geocode: (q: string) => getJson<GeocodeResult[]>(`/api/geo/geocode?q=${encodeURIComponent(q)}`),

  getPersonalPlaces: () => getJson<PersonalPlace[]>("/api/geo/personal-places"),
  createPersonalPlace: (data: Partial<PersonalPlace>) =>
    apiRequest("POST", "/api/geo/personal-places", data).then((r) => r.json() as Promise<PersonalPlace>),
  deletePersonalPlace: (id: string) => apiRequest("DELETE", `/api/geo/personal-places/${id}`),

  getServiceRegions: () => getJson<ServiceRegion[]>("/api/geo/service-regions"),

  getWorkerCoverage: () => getJson<WorkerCoverageZone | null>("/api/geo/worker-coverage"),
  getAllWorkerCoverage: () => getJson<WorkerCoverageZone[]>("/api/geo/worker-coverage/all"),
  saveWorkerCoverage: (data: Partial<WorkerCoverageZone>) =>
    apiRequest("PUT", "/api/geo/worker-coverage", data).then((r) => r.json() as Promise<WorkerCoverageZone>),

  ai: (body: { message: string; bbox?: number[]; activeDomain?: string; visibleLayerIds?: string[] }) =>
    apiRequest("POST", "/api/geo/ai", body).then((r) => r.json() as Promise<GeoAIResponse>),

  // Admin
  createLayer: (data: Partial<MapLayer>) =>
    apiRequest("POST", "/api/geo/layers", data).then((r) => r.json() as Promise<MapLayer>),
  updateLayer: (id: string, data: Partial<MapLayer>) =>
    apiRequest("PATCH", `/api/geo/layers/${id}`, data).then((r) => r.json() as Promise<MapLayer>),
  deleteLayer: (id: string) => apiRequest("DELETE", `/api/geo/layers/${id}`),

  createFeature: (data: Partial<MapFeature>) =>
    apiRequest("POST", "/api/geo/features", data).then((r) => r.json() as Promise<MapFeature>),
  updateFeature: (id: string, data: Partial<MapFeature>) =>
    apiRequest("PATCH", `/api/geo/features/${id}`, data).then((r) => r.json() as Promise<MapFeature>),
  deleteFeature: (id: string) => apiRequest("DELETE", `/api/geo/features/${id}`),

  createCategory: (data: Partial<MapCategory>) =>
    apiRequest("POST", "/api/geo/categories", data).then((r) => r.json() as Promise<MapCategory>),
  deleteCategory: (id: string) => apiRequest("DELETE", `/api/geo/categories/${id}`),

  importGeo: (data: { layerId?: string; newLayer?: Partial<MapLayer>; content?: string; url?: string; replace?: boolean }) =>
    apiRequest("POST", "/api/geo/import", data).then((r) => r.json() as Promise<{ layerId: string; imported: number }>),

  getAudit: () => getJson<any[]>("/api/geo/audit"),
};
