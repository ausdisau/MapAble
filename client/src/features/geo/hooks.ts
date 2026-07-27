import { useQuery } from "@tanstack/react-query";
import { geoApi } from "./api";
import type { MapLayer, MapFeature, MapCategory, PersonalPlace, ServiceRegion } from "./types";

export function useLayers(domain?: string) {
  return useQuery<MapLayer[]>({
    queryKey: ["/api/geo/layers", domain ?? "all"],
    queryFn: () => geoApi.getLayers(domain),
  });
}

export function useFeatures(layerIds: string[], opts?: { q?: string; bbox?: string; limit?: number; enabled?: boolean }) {
  return useQuery<MapFeature[]>({
    queryKey: ["/api/geo/features", layerIds.slice().sort().join(","), opts?.q ?? "", opts?.bbox ?? ""],
    queryFn: () => geoApi.getFeatures({ layerIds, q: opts?.q, bbox: opts?.bbox, limit: opts?.limit }),
    enabled: (opts?.enabled ?? true) && layerIds.length > 0,
  });
}

export function useCategories() {
  return useQuery<MapCategory[]>({
    queryKey: ["/api/geo/categories"],
    queryFn: () => geoApi.getCategories(),
  });
}

export function usePersonalPlaces() {
  return useQuery<PersonalPlace[]>({
    queryKey: ["/api/geo/personal-places"],
    queryFn: () => geoApi.getPersonalPlaces(),
  });
}

export function useServiceRegions() {
  return useQuery<ServiceRegion[]>({
    queryKey: ["/api/geo/service-regions"],
    queryFn: () => geoApi.getServiceRegions(),
  });
}
