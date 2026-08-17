import type { TransportTrip } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { buildTrafficAdvisoryForRoute } from "@/lib/tfnsw/traffic-advisory-service";
import { getHandoverStatus } from "@/lib/transport/handover-service";
import { getActiveAssignment } from "@/lib/transport/transport-access-policy";
import {
  checkVehicleEligibility,
} from "@/lib/transport/transport-eligibility-service";

export async function getSuitabilityWarningsForTrip(
  trip: TransportTrip
): Promise<string[]> {
  const assignment = await getActiveAssignment(trip.id);
  if (!assignment?.vehicleId) return [];

  const result = await checkVehicleEligibility(
    assignment.vehicleId,
    (trip.mobilityRequirements as Record<string, unknown>) ?? {}
  );
  return result.eligible ? [] : result.reasons;
}

export async function enrichTripResponseExtras(
  trip: TransportTrip,
  _user: CurrentUser
) {
  const [handoverStatus, suitabilityWarnings] = await Promise.all([
    getHandoverStatus(trip.id),
    getSuitabilityWarningsForTrip(trip),
  ]);

  let trafficAdvisory;
  if (trip.pickupLat != null && trip.pickupLng != null && trip.dropoffLat != null && trip.dropoffLng != null) {
    trafficAdvisory =
      (await buildTrafficAdvisoryForRoute({
        origin: { lat: trip.pickupLat, lng: trip.pickupLng },
        destination: { lat: trip.dropoffLat, lng: trip.dropoffLng },
        force: true,
      })) ?? undefined;
  }

  const assignment = await getActiveAssignment(trip.id);
  let assignedVehicle: { id: string; displayName: string } | undefined;
  if (assignment?.vehicleId) {
    const v = await prisma.transportVehicle.findUnique({
      where: { id: assignment.vehicleId },
      select: { id: true, displayName: true },
    });
    if (v) assignedVehicle = v;
  }

  return {
    handoverStatus,
    suitabilityWarnings,
    trafficAdvisory,
    assignedVehicle,
  };
}
