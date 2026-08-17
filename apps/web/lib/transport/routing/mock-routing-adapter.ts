import type { RoutingAdapter } from "@/lib/transport/routing/routing-adapter";
import type {
  RouteEstimateInput,
  RouteMatrixInput,
  RouteOptimisationInput,
} from "@/types/transport-routing";

function haversineMetres(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}

export class MockRoutingAdapter implements RoutingAdapter {
  readonly provider = "mock" as const;

  async estimateRoute(input: RouteEstimateInput) {
    const points = [input.origin, ...(input.waypoints ?? []), input.destination];
    let distanceMetres = 0;
    const segments = [];
    for (let i = 0; i < points.length - 1; i++) {
      const d = haversineMetres(points[i], points[i + 1]);
      distanceMetres += d;
      segments.push({
        sequence: i + 1,
        from: points[i],
        to: points[i + 1],
        distanceMetres: d,
        durationSeconds: Math.round(d / 8),
      });
    }
    const durationSeconds = Math.max(300, Math.round(distanceMetres / 8));
    return {
      distanceMetres,
      durationSeconds,
      segments,
      raw: { provider: "mock" },
    };
  }

  async routeMatrix(input: RouteMatrixInput) {
    const durationsSeconds: number[][] = [];
    const distancesMetres: number[][] = [];
    for (const src of input.sources) {
      const dRow: number[] = [];
      const tRow: number[] = [];
      for (const dst of input.destinations) {
        const m = haversineMetres(src, dst);
        dRow.push(m);
        tRow.push(Math.max(60, Math.round(m / 8)));
      }
      distancesMetres.push(dRow);
      durationsSeconds.push(tRow);
    }
    return { durationsSeconds, distancesMetres };
  }

  async optimise(input: RouteOptimisationInput) {
    return [
      {
        summary: `Suggested stop order for ${input.stops.length} stops (mock)`,
        score: 0.9,
        orderedStopIndices: input.stops.map((_, i) => i),
      },
    ];
  }

  async healthCheck() {
    return true;
  }
}

export const mockRoutingAdapter = new MockRoutingAdapter();
