import { transportCommandConfig } from "@/lib/config/transport-command";
import { mockGtfsAdapter } from "@/lib/transport/public-transit/gtfs-adapter";
import type {
  AccessibleRouteDetails,
  PublicTransitAdapter,
  TransitDisruption,
} from "@/lib/transport/public-transit/types";
import { isSourceFresh } from "@/lib/transport/public-transit/types";

const DEFAULT_MAX_AGE_MINUTES = 15;

let activeAdapter: PublicTransitAdapter = mockGtfsAdapter;

export function setPublicTransitAdapter(adapter: PublicTransitAdapter): void {
  activeAdapter = adapter;
}

export function getPublicTransitAdapter(): PublicTransitAdapter {
  return activeAdapter;
}

export async function fetchTransitDisruptions(regionCode?: string) {
  if (!transportCommandConfig.publicTransitAdaptersEnabled) {
    return {
      enabled: false,
      disruptions: [] as TransitDisruption[],
      nonLiveFallback: true,
    };
  }

  const disruptions = await activeAdapter.getDisruptions(regionCode);
  const fresh = disruptions.filter((d) =>
    isSourceFresh(d.source, DEFAULT_MAX_AGE_MINUTES)
  );

  return {
    enabled: true,
    disruptions: fresh.length > 0 ? fresh : disruptions,
    nonLiveFallback: true,
    staleCount: disruptions.length - fresh.length,
  };
}

export async function fetchAccessibleRouteDetails(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{
  enabled: boolean;
  details: AccessibleRouteDetails | null;
  nonLiveFallback: boolean;
}> {
  if (!transportCommandConfig.publicTransitAdaptersEnabled) {
    return { enabled: false, details: null, nonLiveFallback: true };
  }

  const details = await activeAdapter.getAccessibleRouteDetails(origin, destination);
  return {
    enabled: true,
    details,
    nonLiveFallback: details ? !details.source.isLive : true,
  };
}

export async function fetchRouteAccessibility(routeId: string) {
  if (!transportCommandConfig.publicTransitAdaptersEnabled) {
    return { enabled: false, route: null };
  }

  const route = await activeAdapter.getRouteAccessibility(routeId);
  return {
    enabled: true,
    route,
    fresh: route ? isSourceFresh(route.source, DEFAULT_MAX_AGE_MINUTES) : false,
  };
}

export async function fetchLiftOutages(): Promise<TransitDisruption[]> {
  const { disruptions } = await fetchTransitDisruptions();
  return disruptions.filter((d) => d.liftOutage);
}
