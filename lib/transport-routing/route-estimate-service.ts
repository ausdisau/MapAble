import type { TransportRoutingProvider } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { buildTrafficAdvisoryForRoute } from "@/lib/tfnsw/traffic-advisory-service";
import {
  buildRouteCacheKey,
  getCachedEstimate,
  rememberEstimate,
} from "@/lib/transport-routing/route-cache-service";
import { getRoutingAdapter } from "@/lib/transport-routing/routing-provider-registry";
import type { TrafficAdvisory } from "@/types/tfnsw";
import type { RouteEstimateInput } from "@/types/transport-routing";
import { ROUTE_ADVISORY_DISCLAIMER } from "@/types/transport-routing";

export async function createRouteEstimate(params: {
  input: RouteEstimateInput;
  tripId?: string;
  provider?: TransportRoutingProvider;
}) {
  const adapter = getRoutingAdapter(params.provider);
  const cacheKey = buildRouteCacheKey({
    provider: adapter.provider,
    origin: params.input.origin,
    destination: params.input.destination,
  });

  const cached = await getCachedEstimate(cacheKey);
  if (cached) {
    const trafficAdvisory = await maybeTrafficAdvisory(params.input);
    return {
      estimate: cached,
      advisoryDisclaimer: ROUTE_ADVISORY_DISCLAIMER,
      fromCache: true,
      ...(trafficAdvisory ? { trafficAdvisory } : {}),
    };
  }

  const result = await adapter.estimateRoute(params.input);

  const estimate = await prisma.transportRouteEstimate.create({
    data: {
      tripId: params.tripId,
      provider: adapter.provider,
      distanceMetres: result.distanceMetres,
      durationSeconds: result.durationSeconds,
      advisoryOnly: true,
      cacheKey,
      rawResponse: result.raw ?? undefined,
    },
  });

  if (result.segments?.length) {
    await prisma.transportRouteSegment.createMany({
      data: result.segments.map((s) => ({
        estimateId: estimate.id,
        sequence: s.sequence,
        fromLat: s.from.lat,
        fromLng: s.from.lng,
        toLat: s.to.lat,
        toLng: s.to.lng,
        distanceMetres: s.distanceMetres,
        durationSeconds: s.durationSeconds,
      })),
    });
  }

  rememberEstimate(cacheKey, estimate.id);

  const trafficAdvisory = await maybeTrafficAdvisory(params.input);

  return {
    estimate,
    advisoryDisclaimer: ROUTE_ADVISORY_DISCLAIMER,
    fromCache: false,
    ...(trafficAdvisory ? { trafficAdvisory } : {}),
  };
}

async function maybeTrafficAdvisory(
  input: RouteEstimateInput
): Promise<TrafficAdvisory | undefined> {
  const advisory = await buildTrafficAdvisoryForRoute({
    origin: input.origin,
    destination: input.destination,
    waypoints: input.waypoints,
  });
  return advisory ?? undefined;
}
