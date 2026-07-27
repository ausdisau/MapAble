import type {
  AccessibleRouteDetails,
  GtfsRealtimeUpdate,
  GtfsRouteAccessibility,
  PublicTransitAdapter,
  TransitDisruption,
} from "@/lib/transport/public-transit/types";
import { buildTransitSource } from "@/lib/transport/public-transit/types";

const PROVIDER_ID = "mock-gtfs";

/** Static GTFS snapshot adapter for development and non-live fallback. */
export class MockGtfsAdapter implements PublicTransitAdapter {
  readonly providerId = PROVIDER_ID;

  async getRouteAccessibility(routeId: string): Promise<GtfsRouteAccessibility | null> {
    const routes: Record<string, GtfsRouteAccessibility["wheelchairAccessible"]> = {
      "bus-400": "full",
      "bus-333": "partial",
      "train-t1": "full",
    };
    const accessibility = routes[routeId];
    if (!accessibility) return null;

    return {
      routeId,
      routeName: routeId.replace(/-/g, " ").toUpperCase(),
      wheelchairAccessible: accessibility,
      evidenceSource: "GTFS trips.txt wheelchair_accessible field",
      source: buildTransitSource(PROVIDER_ID, "Mock GTFS static feed", false),
    };
  }

  async getRealtimeUpdates(routeIds: string[]): Promise<GtfsRealtimeUpdate[]> {
    return routeIds.map((routeId) => ({
      tripId: `${routeId}-trip-1`,
      routeId,
      delayMinutes: routeId === "bus-333" ? 12 : 0,
      cancelled: false,
      source: buildTransitSource(PROVIDER_ID, "Mock GTFS-RT feed", true),
    }));
  }

  async getDisruptions(): Promise<TransitDisruption[]> {
    return [
      {
        id: "mock-lift-outage-1",
        kind: "lift_outage",
        title: "Lift outage — Central Station",
        description: "Platform 16 lift out of service until further notice.",
        affectedRouteIds: ["train-t1"],
        liftOutage: true,
        source: buildTransitSource(PROVIDER_ID, "Mock GTFS-RT alerts", true),
        nonLiveAlternativeAvailable: true,
      },
    ];
  }

  async getAccessibleRouteDetails(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<AccessibleRouteDetails | null> {
    return {
      routeId: "mock-journey-1",
      segments: [
        {
          mode: "walk",
          from: `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}`,
          to: "Nearest accessible stop",
          wheelchairAccessible: "full",
          evidenceSource: "OSM footpath data",
        },
        {
          mode: "bus",
          from: "Accessible stop",
          to: "Destination stop",
          wheelchairAccessible: "full",
          evidenceSource: "GTFS trips.txt wheelchair_accessible=1",
        },
        {
          mode: "walk",
          from: "Destination stop",
          to: `${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`,
          wheelchairAccessible: "partial",
          evidenceSource: "OSM footpath data",
        },
      ],
      source: buildTransitSource(PROVIDER_ID, "Mock GTFS trip planner", false),
      advisoryOnly: true,
    };
  }
}

export const mockGtfsAdapter = new MockGtfsAdapter();

export async function getGtfsRouteAccessibility(
  adapter: PublicTransitAdapter,
  routeId: string
): Promise<GtfsRouteAccessibility | null> {
  return adapter.getRouteAccessibility(routeId);
}

export async function getGtfsRealtimeUpdates(
  adapter: PublicTransitAdapter,
  routeIds: string[]
): Promise<GtfsRealtimeUpdate[]> {
  return adapter.getRealtimeUpdates(routeIds);
}
