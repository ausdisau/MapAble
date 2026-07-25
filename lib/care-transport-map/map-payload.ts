import type { AccessPlaceCategory } from "@prisma/client";

import {
  CARE_TRANSPORT_INFRA_CATEGORIES,
  getCareTransportMapPinLimit,
} from "@/lib/config/care-transport-map";
import { getProviderFinderMapPinLimit } from "@/lib/config/provider-finder-map";
import { searchNdisProviders } from "@/lib/ingestion/ndis-providers-search";
import { entitiesToGeoJSON } from "@/lib/map/geojson";
import { MAP_SOURCE_IDS } from "@/lib/map/map-layer-ids";
import type { MapFeatureCollection, MapPointEntity } from "@/lib/map/types";
import { prisma } from "@/lib/prisma";
import { projectLocationForStage } from "@/lib/transport/privacy/location-disclosure";

export type CareTransportMapLayer =
  | "careProviders"
  | "infrastructure"
  | "trips";

export type CareTransportMapPayload = {
  careProviders: MapFeatureCollection;
  infrastructure: MapFeatureCollection;
  trips: MapFeatureCollection | null;
  meta: {
    careProviderCount: number;
    infrastructureCount: number;
    tripPointCount: number;
    tripsIncluded: boolean;
    pinLimit: number;
    honesty: string;
  };
};

function emptyCollection(): MapFeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

export async function buildCareProviderLayer(
  limit: number,
): Promise<{ collection: MapFeatureCollection; count: number }> {
  const { providers } = await searchNdisProviders({
    limit,
    withCoordinatesOnly: true,
  });

  const entities: MapPointEntity[] = providers
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      id: p.source_id,
      kind: "care_provider" as const,
      name: p.provider_name,
      lat: p.latitude!,
      lng: p.longitude!,
      subtitle: [p.suburb, p.state].filter(Boolean).join(", ") || undefined,
      layerId: MAP_SOURCE_IDS.careProviders,
    }));

  return {
    collection: entitiesToGeoJSON(entities),
    count: entities.length,
  };
}

export async function buildInfrastructureLayer(
  limit: number,
): Promise<{ collection: MapFeatureCollection; count: number }> {
  const categories = [
    ...CARE_TRANSPORT_INFRA_CATEGORIES,
  ] as AccessPlaceCategory[];

  const places = await prisma.accessPlace.findMany({
    where: {
      status: "published",
      category: { in: categories },
      location: { isNot: null },
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
    include: { location: true },
  });

  const entities: MapPointEntity[] = places
    .filter((p) => p.location != null)
    .map((p) => ({
      id: p.id,
      kind: "transport_infra" as const,
      name: p.name,
      lat: p.location!.latitude,
      lng: p.location!.longitude,
      subtitle:
        [p.suburb, p.stateOrRegion, p.category].filter(Boolean).join(" · ") ||
        undefined,
      layerId: MAP_SOURCE_IDS.infrastructure,
    }));

  return {
    collection: entitiesToGeoJSON(entities),
    count: entities.length,
  };
}

function tripStageFromStatus(
  status: string,
): "request" | "quote" | "accepted" | "assigned" | "in_service" | "completed" {
  switch (status) {
    case "requested":
    case "provider_review":
      return "request";
    case "accepted":
    case "dispatch_pending":
      return "accepted";
    case "driver_vehicle_assigned":
    case "driver_accepted":
    case "pre_start_check_required":
      return "assigned";
    case "en_route_to_pickup":
    case "arrived_at_pickup":
    case "participant_boarded":
    case "en_route_to_dropoff":
    case "arrived_at_dropoff":
    case "handover_completed":
      return "in_service";
    case "trip_completed":
    case "evidence_submitted":
    case "participant_review":
    case "closed":
      return "completed";
    default:
      return "request";
  }
}

export async function buildMaskedTripLayer(
  participantUserId: string,
  limit: number,
): Promise<{ collection: MapFeatureCollection; count: number }> {
  const trips = await prisma.transportTrip.findMany({
    where: { participantId: participantUserId },
    take: Math.min(limit, 50),
    orderBy: { scheduledStart: "desc" },
    select: {
      id: true,
      status: true,
      pickupAddress: true,
      pickupSuburb: true,
      pickupLat: true,
      pickupLng: true,
      dropoffAddress: true,
      dropoffSuburb: true,
      dropoffLat: true,
      dropoffLng: true,
    },
  });

  const entities: MapPointEntity[] = [];

  for (const trip of trips) {
    const stage = tripStageFromStatus(trip.status);
    const pickup = projectLocationForStage({
      stage,
      suburb: trip.pickupSuburb ?? undefined,
      exactAddress: trip.pickupAddress,
      coordinates:
        trip.pickupLat != null && trip.pickupLng != null
          ? { lat: trip.pickupLat, lng: trip.pickupLng }
          : undefined,
      role: "participant",
    });
    const dropoff = projectLocationForStage({
      stage,
      suburb: trip.dropoffSuburb ?? undefined,
      exactAddress: trip.dropoffAddress,
      coordinates:
        trip.dropoffLat != null && trip.dropoffLng != null
          ? { lat: trip.dropoffLat, lng: trip.dropoffLng }
          : undefined,
      role: "participant",
    });

    // Public GeoJSON properties stay suburb-level labels; coords only when disclosure allows.
    if (pickup.coordinates && !pickup.redacted) {
      entities.push({
        id: `${trip.id}:pickup`,
        kind: "trip_point",
        name: `Pickup · ${pickup.label}`,
        lat: pickup.coordinates.lat,
        lng: pickup.coordinates.lng,
        subtitle: pickup.suburb,
        layerId: MAP_SOURCE_IDS.transportTrips,
      });
    } else if (pickup.coordinates && pickup.redacted) {
      // Masked: keep coords only if suburb centroid already stored; never expose exact address text.
      entities.push({
        id: `${trip.id}:pickup`,
        kind: "trip_point",
        name: `Pickup · ${pickup.suburb ?? "Suburb withheld"}`,
        lat: pickup.coordinates.lat,
        lng: pickup.coordinates.lng,
        subtitle: "Masked until assignment window",
        layerId: MAP_SOURCE_IDS.transportTrips,
      });
    }

    if (dropoff.coordinates && !dropoff.redacted) {
      entities.push({
        id: `${trip.id}:dropoff`,
        kind: "trip_point",
        name: `Drop-off · ${dropoff.label}`,
        lat: dropoff.coordinates.lat,
        lng: dropoff.coordinates.lng,
        subtitle: dropoff.suburb,
        layerId: MAP_SOURCE_IDS.pickupPoints,
      });
    } else if (dropoff.coordinates && dropoff.redacted) {
      entities.push({
        id: `${trip.id}:dropoff`,
        kind: "trip_point",
        name: `Drop-off · ${dropoff.suburb ?? "Suburb withheld"}`,
        lat: dropoff.coordinates.lat,
        lng: dropoff.coordinates.lng,
        subtitle: "Masked until assignment window",
        layerId: MAP_SOURCE_IDS.pickupPoints,
      });
    }
  }

  return {
    collection: entitiesToGeoJSON(entities),
    count: entities.length,
  };
}

export async function buildCareTransportMapPayload(options: {
  layers?: CareTransportMapLayer[];
  includeTrips: boolean;
  participantUserId?: string | null;
}): Promise<CareTransportMapPayload> {
  const pinLimit = Math.min(
    getCareTransportMapPinLimit(),
    getProviderFinderMapPinLimit(),
  );
  const wanted = new Set<CareTransportMapLayer>(
    options.layers?.length
      ? options.layers
      : ["careProviders", "infrastructure", ...(options.includeTrips ? (["trips"] as const) : [])],
  );

  let careProviders = emptyCollection();
  let careProviderCount = 0;
  if (wanted.has("careProviders")) {
    const built = await buildCareProviderLayer(pinLimit);
    careProviders = built.collection;
    careProviderCount = built.count;
  }

  let infrastructure = emptyCollection();
  let infrastructureCount = 0;
  if (wanted.has("infrastructure")) {
    const built = await buildInfrastructureLayer(pinLimit);
    infrastructure = built.collection;
    infrastructureCount = built.count;
  }

  let trips: MapFeatureCollection | null = null;
  let tripPointCount = 0;
  let tripsIncluded = false;
  if (
    wanted.has("trips") &&
    options.includeTrips &&
    options.participantUserId
  ) {
    const built = await buildMaskedTripLayer(
      options.participantUserId,
      pinLimit,
    );
    trips = built.collection;
    tripPointCount = built.count;
    tripsIncluded = true;
  }

  return {
    careProviders,
    infrastructure,
    trips,
    meta: {
      careProviderCount,
      infrastructureCount,
      tripPointCount,
      tripsIncluded,
      pinLimit,
      honesty:
        "Pilot map. Pins are discovery aids, not live ETA or dispatch confirmation. Exact trip addresses stay role-gated. OpenStreetMap attribution applies to base tiles.",
    },
  };
}
