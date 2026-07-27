import type { WorkerCoverageZone } from "./types";

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface GeofenceResult {
  evaluated: boolean;
  inside: boolean;
  distanceKm?: number;
  radiusKm?: number;
  reason?: string;
}

/**
 * Evaluate whether a point is within a worker's coverage zone.
 * Currently supports radius mode (centerLat/centerLng + radiusKm).
 * Returns evaluated=false when the zone has no usable geometry to test against.
 */
export function evaluateCoverage(
  zone: WorkerCoverageZone | null | undefined,
  lat: number,
  lng: number,
): GeofenceResult {
  if (!zone) return { evaluated: false, inside: false, reason: "No coverage zone set" };

  const centerLat = zone.centerLat != null ? Number(zone.centerLat) : NaN;
  const centerLng = zone.centerLng != null ? Number(zone.centerLng) : NaN;
  const radiusKm = zone.radiusKm != null ? Number(zone.radiusKm) : NaN;

  if (!Number.isNaN(centerLat) && !Number.isNaN(centerLng) && !Number.isNaN(radiusKm) && radiusKm > 0) {
    const distanceKm = haversineKm(centerLat, centerLng, lat, lng);
    return {
      evaluated: true,
      inside: distanceKm <= radiusKm,
      distanceKm,
      radiusKm,
    };
  }

  return { evaluated: false, inside: false, reason: "Coverage zone has no radius defined" };
}
