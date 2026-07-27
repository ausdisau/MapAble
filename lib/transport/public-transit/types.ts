export type TransitDataSource = {
  providerId: string;
  label: string;
  fetchedAt: Date;
  isLive: boolean;
};

export type GtfsRouteAccessibility = {
  routeId: string;
  routeName: string;
  wheelchairAccessible: "unknown" | "partial" | "full";
  evidenceSource: string;
  source: TransitDataSource;
};

export type GtfsRealtimeUpdate = {
  tripId: string;
  routeId: string;
  delayMinutes: number | null;
  cancelled: boolean;
  source: TransitDataSource;
};

export type TransitDisruption = {
  id: string;
  kind: "service_alert" | "lift_outage" | "route_disruption";
  title: string;
  description: string;
  affectedRouteIds: string[];
  liftOutage: boolean;
  source: TransitDataSource;
  nonLiveAlternativeAvailable: boolean;
};

export type AccessibleRouteDetails = {
  routeId: string;
  segments: Array<{
    mode: "bus" | "train" | "ferry" | "tram" | "walk";
    from: string;
    to: string;
    wheelchairAccessible: "unknown" | "partial" | "full";
    evidenceSource: string;
  }>;
  source: TransitDataSource;
  advisoryOnly: true;
};

export interface PublicTransitAdapter {
  readonly providerId: string;
  getRouteAccessibility(routeId: string): Promise<GtfsRouteAccessibility | null>;
  getRealtimeUpdates(routeIds: string[]): Promise<GtfsRealtimeUpdate[]>;
  getDisruptions(regionCode?: string): Promise<TransitDisruption[]>;
  getAccessibleRouteDetails(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<AccessibleRouteDetails | null>;
}

export function buildTransitSource(
  providerId: string,
  label: string,
  isLive: boolean
): TransitDataSource {
  return {
    providerId,
    label,
    fetchedAt: new Date(),
    isLive,
  };
}

export function isSourceFresh(source: TransitDataSource, maxAgeMinutes: number): boolean {
  const ageMs = Date.now() - source.fetchedAt.getTime();
  return ageMs <= maxAgeMinutes * 60 * 1000;
}
