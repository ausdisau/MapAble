import { tfnswConfig, isTfnswLiveTrafficAvailable } from "@/lib/config/tfnsw";
import { getLiveTrafficHazards } from "@/lib/tfnsw/live-traffic-service";
import type {
  LiveTrafficFeature,
  TrafficAdvisory,
  TrafficAdvisoryHazard,
} from "@/types/tfnsw";
import type { LatLng } from "@/types/transport-routing";

export const TRAFFIC_ADVISORY_DISCLAIMER =
  "Road hazard information is indicative only, sourced from Live Traffic NSW. It does not replace driver judgement or official directions.";

const EARTH_RADIUS_M = 6_371_000;

function haversineMetres(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function extractPoint(feature: LiveTrafficFeature): LatLng | null {
  const geom = feature.geometry;
  if (!geom || geom.type !== "Point" || !("coordinates" in geom)) return null;
  const [lng, lat] = geom.coordinates;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return { lat, lng };
}

function bboxFromRoute(points: LatLng[], paddingMetres = 2000): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const padDeg = paddingMetres / 111_000;
  return {
    minLat: Math.min(...lats) - padDeg,
    maxLat: Math.max(...lats) + padDeg,
    minLng: Math.min(...lngs) - padDeg,
    maxLng: Math.max(...lngs) + padDeg,
  };
}

function inBbox(point: LatLng, box: ReturnType<typeof bboxFromRoute>): boolean {
  return (
    point.lat >= box.minLat &&
    point.lat <= box.maxLat &&
    point.lng >= box.minLng &&
    point.lng <= box.maxLng
  );
}

function featureToHazard(
  feature: LiveTrafficFeature,
  ref: LatLng
): TrafficAdvisoryHazard | null {
  const point = extractPoint(feature);
  if (!point) return null;
  const props = feature.properties ?? {};
  const id =
    typeof props.id === "string"
      ? props.id
      : typeof props.guid === "string"
        ? props.guid
        : undefined;
  return {
    id,
    category: typeof props.category === "string" ? props.category : undefined,
    headline:
      typeof props.headline === "string"
        ? props.headline
        : typeof props.title === "string"
          ? props.title
          : undefined,
    subCategory:
      typeof props.subCategory === "string" ? props.subCategory : undefined,
    lat: point.lat,
    lng: point.lng,
    distanceMetres: Math.round(haversineMetres(ref, point)),
  };
}

/**
 * Returns open hazards near a route corridor (origin, destination, optional waypoints).
 * Best-effort: uses incident/open feed; does not fetch every hazard subtype separately.
 */
export async function buildTrafficAdvisoryForRoute(params: {
  origin: LatLng;
  destination: LatLng;
  waypoints?: LatLng[];
  maxHazards?: number;
  radiusMetres?: number;
  /** When true, runs even if TFNSW_ENRICH_ROUTE_ESTIMATES is off (explicit API calls) */
  force?: boolean;
}): Promise<TrafficAdvisory | null> {
  if (!isTfnswLiveTrafficAvailable()) {
    return null;
  }
  if (!params.force && !tfnswConfig.enrichRouteEstimates) {
    return null;
  }

  const corridor = [params.origin, ...(params.waypoints ?? []), params.destination];
  const ref = params.origin;
  const box = bboxFromRoute(corridor, params.radiusMetres ?? 3000);
  const max = params.maxHazards ?? 8;

  try {
    const collection = await getLiveTrafficHazards({
      category: "incident",
      state: "open",
    });
    const features = collection.features ?? [];
    const hazards: TrafficAdvisoryHazard[] = [];

    for (const feature of features) {
      const point = extractPoint(feature);
      if (!point || !inBbox(point, box)) continue;
      const hazard = featureToHazard(feature, ref);
      if (hazard) hazards.push(hazard);
    }

    hazards.sort(
      (a, b) => (a.distanceMetres ?? Infinity) - (b.distanceMetres ?? Infinity)
    );

    return {
      source: "tfnsw_live_traffic",
      disclaimer: TRAFFIC_ADVISORY_DISCLAIMER,
      hazardCount: hazards.length,
      hazards: hazards.slice(0, max),
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
