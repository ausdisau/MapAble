import type { TransportTrip, TransportDriver } from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { checkConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";
import { TransportApiError } from "@/lib/transport/transport-api-error";

export type TripAccessLevel = "none" | "summary" | "exact";

const ACTIVE_TRIP_STATUSES = new Set([
  "driver_accepted",
  "pre_start_check_required",
  "en_route_to_pickup",
  "arrived_at_pickup",
  "participant_boarded",
  "en_route_to_dropoff",
  "arrived_at_dropoff",
  "handover_completed",
]);

export async function getActiveAssignment(tripId: string) {
  return prisma.transportDispatchAssignment.findFirst({
    where: { tripId, active: true },
    include: { driver: true, vehicle: true },
  });
}

export async function getTransportDriverForUser(userId: string) {
  return prisma.transportDriver.findFirst({
    where: { userId, active: true },
  });
}

export async function resolveTripAccess(
  user: CurrentUser,
  trip: Pick<
    TransportTrip,
    "id" | "participantId" | "providerOrganisationId" | "status"
  >
): Promise<TripAccessLevel> {
  if (isAdminRole(user.primaryRole)) return "exact";

  if (trip.participantId === user.id) return "exact";

  if (user.primaryRole === "family_member") {
    const ok = await checkConsent({
      subjectUserId: trip.participantId,
      scope: "transport.trip_access",
      grantedToUserId: user.id,
    });
    return ok ? "summary" : "none";
  }

  if (
    user.primaryRole === "support_coordinator" &&
    hasPermission(user.primaryRole, "booking:read:any")
  ) {
    return "summary";
  }

  if (trip.providerOrganisationId) {
    const orgIds = await getUserOrganisationIds(user.id);
    if (orgIds.includes(trip.providerOrganisationId)) {
      if (
        hasPermission(user.primaryRole, "transport:manage:org") ||
        hasPermission(user.primaryRole, "transport:read:org")
      ) {
        return "exact";
      }
    }
  }

  if (user.primaryRole === "driver" && hasPermission(user.primaryRole, "transport:drive")) {
    const driver = await getTransportDriverForUser(user.id);
    if (!driver) return "none";
    const assignment = await getActiveAssignment(trip.id);
    if (assignment?.driverId === driver.id) return "exact";
    return "none";
  }

  return "none";
}

export async function assertCanAccessTrip(
  user: CurrentUser,
  trip: Pick<
    TransportTrip,
    "id" | "participantId" | "providerOrganisationId" | "status"
  >,
  minLevel: TripAccessLevel = "summary"
): Promise<TripAccessLevel> {
  const level = await resolveTripAccess(user, trip);
  if (level === "none" || (minLevel === "exact" && level !== "exact")) {
    throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  }
  return level;
}

export async function assertProviderOrgTrip(
  user: CurrentUser,
  organisationId: string
) {
  if (isAdminRole(user.primaryRole)) return;
  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(organisationId)) {
    throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  }
  if (!hasPermission(user.primaryRole, "transport:manage:org")) {
    throw new TransportApiError("TRANSPORT_ACCESS_DENIED");
  }
}

export function canShareLiveLocation(
  trip: Pick<TransportTrip, "status">,
  access: TripAccessLevel
): boolean {
  if (access === "none") return false;
  return ACTIVE_TRIP_STATUSES.has(trip.status);
}

export async function assertAssignedDriver(
  user: CurrentUser,
  tripId: string
): Promise<TransportDriver> {
  const driver = await getTransportDriverForUser(user.id);
  if (!driver) throw new TransportApiError("TRANSPORT_ACCESS_DENIED");
  const assignment = await getActiveAssignment(tripId);
  if (!assignment || assignment.driverId !== driver.id) {
    throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  }
  return driver;
}
