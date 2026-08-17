import type { TransportRouteEstimate, TransportTrip } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import {
  getActiveAssignment,
  resolveTripAccess,
  type TripAccessLevel,
} from "@/lib/transport/transport-access-policy";
import { enrichTripResponseExtras } from "@/lib/transport/trip-enrichment-service";
import type {
  TransportNextAction,
  TransportTripApiResponse,
  TransportTripDetail,
  TransportTripPermissions,
} from "@/types/transport";
import { ROUTE_ADVISORY_DISCLAIMER } from "@/types/transport-routing";

function shapeAddress(
  trip: TransportTrip,
  kind: "pickup" | "dropoff",
  access: TripAccessLevel
) {
  const suburb =
    kind === "pickup" ? trip.pickupSuburb : trip.dropoffSuburb;
  const address =
    kind === "pickup" ? trip.pickupAddress : trip.dropoffAddress;
  const lat = kind === "pickup" ? trip.pickupLat : trip.dropoffLat;
  const lng = kind === "pickup" ? trip.pickupLng : trip.dropoffLng;

  if (access === "exact") {
    return {
      suburb,
      address,
      lat,
      lng,
      accessNotes: kind === "pickup" ? trip.accessNotes : undefined,
    };
  }
  return { suburb: suburb ?? "Location shared when trip is active" };
}

export function buildPermissions(
  user: CurrentUser,
  trip: TransportTrip,
  access: TripAccessLevel,
  hasAssignment: boolean
): TransportTripPermissions {
  const isParticipant = trip.participantId === user.id;
  const isProvider =
    !isAdminRole(user.primaryRole) &&
    hasPermission(user.primaryRole, "transport:manage:org");
  const isDriver = hasPermission(user.primaryRole, "transport:drive");
  const exact = access === "exact";

  return {
    canViewExactPickup: exact,
    canViewExactDropoff: exact,
    canCancel:
      isParticipant &&
      ["requested", "provider_review", "accepted", "dispatch_pending"].includes(
        trip.status
      ),
    canConfirm: isParticipant && trip.status === "participant_review",
    canDispute: isParticipant && ["closed", "trip_completed"].includes(trip.status),
    canAccept: isProvider && trip.status === "provider_review",
    canDecline: isProvider && trip.status === "provider_review",
    canAssign:
      isProvider &&
      ["accepted", "dispatch_pending"].includes(trip.status) &&
      !hasAssignment,
    canUnassign: isProvider && hasAssignment,
    canUpdateStatus:
      isDriver && hasAssignment && !["closed", "cancelled"].includes(trip.status),
    canSubmitLocation:
      isDriver &&
      hasAssignment &&
      [
        "en_route_to_pickup",
        "arrived_at_pickup",
        "participant_boarded",
        "en_route_to_dropoff",
        "arrived_at_dropoff",
      ].includes(trip.status),
    canSubmitEvidence:
      isDriver && hasAssignment && trip.status === "trip_completed",
    canReportIssue: isDriver && hasAssignment,
    canRequestServiceRecovery:
      isProvider && ["disputed", "handover_failed", "unsafe_to_continue"].includes(
        trip.status
      ),
  };
}

export function buildNextActions(
  permissions: TransportTripPermissions,
  tripId: string
): TransportNextAction[] {
  const actions: TransportNextAction[] = [];
  const base = `/api/transport/trips/${tripId}`;
  if (permissions.canCancel)
    actions.push({ action: "cancel", label: "Cancel trip", method: "POST", href: `${base}/cancel` });
  if (permissions.canConfirm)
    actions.push({ action: "confirm", label: "Confirm trip", method: "POST", href: `${base}/confirm` });
  if (permissions.canDispute)
    actions.push({ action: "dispute", label: "Dispute trip", method: "POST", href: `${base}/dispute` });
  if (permissions.canAccept)
    actions.push({
      action: "accept",
      label: "Accept trip",
      method: "POST",
      href: `/api/provider/transport/trips/${tripId}/accept`,
    });
  if (permissions.canAssign)
    actions.push({
      action: "assign",
      label: "Assign driver and vehicle",
      method: "POST",
      href: `/api/provider/transport/trips/${tripId}/assign`,
    });
  if (permissions.canUpdateStatus)
    actions.push({
      action: "update_status",
      label: "Update trip status",
      method: "POST",
      href: `/api/driver/transport/trips/${tripId}/status`,
    });
  return actions;
}

export async function buildTripResponse(params: {
  trip: TransportTrip;
  user: CurrentUser;
  routeEstimate?: TransportRouteEstimate | null;
}): Promise<TransportTripApiResponse> {
  const access = await resolveTripAccess(params.user, params.trip);
  const assignment = await getActiveAssignment(params.trip.id);
  const permissions = buildPermissions(
    params.user,
    params.trip,
    access,
    Boolean(assignment)
  );

  const trip: TransportTripDetail = {
    id: params.trip.id,
    status: params.trip.status,
    participantId: params.trip.participantId,
    scheduledStart: params.trip.scheduledStart.toISOString(),
    scheduledEnd: params.trip.scheduledEnd?.toISOString() ?? null,
    pickup: shapeAddress(params.trip, "pickup", access),
    dropoff: shapeAddress(params.trip, "dropoff", access),
    providerOrganisationId: params.trip.providerOrganisationId,
    mobilityRequirements:
      (params.trip.mobilityRequirements as Record<string, unknown>) ?? {},
    disputeReason: params.trip.disputeReason,
    createdAt: params.trip.createdAt.toISOString(),
    updatedAt: params.trip.updatedAt.toISOString(),
  };

  const extras = await enrichTripResponseExtras(params.trip, params.user);

  const booking = await prisma.booking.findFirst({
    where: { transportTripId: params.trip.id },
    select: { id: true },
  });

  return {
    trip,
    permissions,
    nextActions: buildNextActions(permissions, params.trip.id),
    routeEstimate: params.routeEstimate
      ? {
          distanceMetres: params.routeEstimate.distanceMetres,
          durationSeconds: params.routeEstimate.durationSeconds,
          advisoryDisclaimer: ROUTE_ADVISORY_DISCLAIMER,
          provider: params.routeEstimate.provider,
        }
      : undefined,
    suitabilityWarnings: extras.suitabilityWarnings,
    handoverStatus: {
      preStartComplete: extras.handoverStatus.preStartComplete,
      pickupHandoverComplete: extras.handoverStatus.pickupHandoverComplete,
      dropoffHandoverComplete: extras.handoverStatus.dropoffHandoverComplete,
    },
    trafficAdvisory: extras.trafficAdvisory,
    assignedVehicle: extras.assignedVehicle,
    linkedBookingId: booking?.id,
  };
}
