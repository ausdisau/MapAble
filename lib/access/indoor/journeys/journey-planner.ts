export type OutdoorRouteSegment = {
  type: "outdoor_path" | "transport_leg" | "drop_off_to_entrance" | "parking_to_entrance";
  instruction: string;
  distanceMetres?: number;
  estimatedMinutes?: number;
  verified: boolean;
};

export type IndoorJourneySegment = {
  type: "entrance_transition" | "indoor_route" | "floor_transition" | "destination_arrival";
  instruction: string;
  floorPlanId?: string;
  featureId?: string;
  distanceMetres?: number;
  verified: boolean;
};

export type DoorToDestinationJourney = {
  venueId: string;
  venueName: string;
  entranceFeatureId?: string;
  segments: Array<OutdoorRouteSegment | IndoorJourneySegment>;
  warnings: string[];
  outdoorRoutingAvailable: boolean;
};

export interface OutdoorRoutingProvider {
  planRoute(input: {
    fromLat: number;
    fromLng: number;
    toLat: number;
    toLng: number;
  }): Promise<{
    segments: OutdoorRouteSegment[];
    totalDistanceMetres?: number;
  } | null>;
}

/** Compose door-to-destination journey from outdoor provider + indoor route steps. */
export async function composeDoorToDestinationJourney(params: {
  venueId: string;
  venueName: string;
  entranceName: string;
  entranceFeatureId: string;
  indoorSteps: Array<{ instruction: string; floorPlanId: string; featureId?: string; distanceMetres?: number }>;
  outdoorProvider?: OutdoorRoutingProvider;
  outdoorAvailable?: boolean;
}): Promise<DoorToDestinationJourney> {
  const segments: DoorToDestinationJourney["segments"] = [];

  if (params.outdoorProvider && params.outdoorAvailable) {
    segments.push({
      type: "drop_off_to_entrance",
      instruction: "Outdoor routing is configured — connect your arrival point to the selected entrance.",
      verified: false,
    });
  } else {
    segments.push({
      type: "outdoor_path",
      instruction:
        "Outdoor routing is not configured. Arrive at the venue and proceed to the selected accessible entrance.",
      verified: false,
    });
  }

  segments.push({
    type: "entrance_transition",
    instruction: `Enter through ${params.entranceName}.`,
    featureId: params.entranceFeatureId,
    verified: true,
  });

  for (const step of params.indoorSteps) {
    segments.push({
      type: "indoor_route",
      instruction: step.instruction,
      floorPlanId: step.floorPlanId,
      featureId: step.featureId,
      distanceMetres: step.distanceMetres,
      verified: true,
    });
  }

  segments.push({
    type: "destination_arrival",
    instruction: "You have reached your destination.",
    verified: true,
  });

  return {
    venueId: params.venueId,
    venueName: params.venueName,
    entranceFeatureId: params.entranceFeatureId,
    segments,
    warnings: params.outdoorAvailable
      ? []
      : ["Outdoor routing provider is not configured. Indoor segment uses verified route data only."],
    outdoorRoutingAvailable: Boolean(params.outdoorAvailable),
  };
}
