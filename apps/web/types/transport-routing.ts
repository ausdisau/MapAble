import type { TransportRoutingProvider } from "@prisma/client";

export type { TransportRoutingProvider };

export type LatLng = { lat: number; lng: number };

export type RouteEstimateInput = {
  origin: LatLng;
  destination: LatLng;
  waypoints?: LatLng[];
};

export type RouteEstimateResult = {
  distanceMetres: number;
  durationSeconds: number;
  segments?: Array<{
    sequence: number;
    from: LatLng;
    to: LatLng;
    distanceMetres?: number;
    durationSeconds?: number;
  }>;
  raw?: unknown;
};

export type RouteMatrixInput = {
  sources: LatLng[];
  destinations: LatLng[];
};

export type RouteMatrixResult = {
  durationsSeconds: number[][];
  distancesMetres: number[][];
};

export type RouteOptimisationInput = {
  tripId?: string;
  stops: LatLng[];
  organisationId?: string;
};

export type RouteOptimisationSuggestion = {
  summary: string;
  score?: number;
  orderedStopIndices?: number[];
};

export const ROUTE_ADVISORY_DISCLAIMER =
  "Travel times and distances are estimates only and are not guaranteed.";
