import type { Prisma, TransportTripStatus } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { bridgeTransportTripToBooking } from "@/lib/transport/booking-bridge-service";
import { logDataAccess } from "@/lib/transport/data-access-log-service";
import {
  normalizeMobilityRequirements,
  parseMobilityRequirements,
} from "@/lib/transport/mobility-schema";
import { getMobilityPrefillForUser } from "@/lib/transport/profile-prefill-service";
import {
  assertCanAccessTrip,
  assertProviderOrgTrip,
} from "@/lib/transport/transport-access-policy";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { recordTripEvent } from "@/lib/transport/transport-event-service";
import { buildTripResponse } from "@/lib/transport/transport-response";
import { assertStatusTransition } from "@/lib/transport/transport-status-service";
import type { CreateTransportTripInput } from "@/lib/validation/transport-trip-schemas";

function defaultScheduledEnd(start: Date) {
  return new Date(start.getTime() + 60 * 60 * 1000);
}

export async function createTransportTrip(
  user: CurrentUser,
  input: CreateTransportTripInput
) {
  const scheduledStart = new Date(input.scheduledStart);
  const scheduledEnd = input.scheduledEnd
    ? new Date(input.scheduledEnd)
    : defaultScheduledEnd(scheduledStart);

  let mobilityRequirements = parseMobilityRequirements(
    input.mobilityRequirements
  );
  let accessNotes = input.accessNotes;

  if (input.prefillFromProfile) {
    const prefill = await getMobilityPrefillForUser(user);
    mobilityRequirements = normalizeMobilityRequirements({
      ...prefill.mobilityRequirements,
      ...mobilityRequirements,
    });
    if (!accessNotes && prefill.accessNotes) {
      accessNotes = prefill.accessNotes;
    }
  } else {
    mobilityRequirements = normalizeMobilityRequirements(mobilityRequirements);
  }

  const mobilityJson = mobilityRequirements as Prisma.InputJsonValue;

  const request = await prisma.transportTripRequest.create({
    data: {
      participantId: user.id,
      providerOrganisationId: input.providerOrganisationId,
      pickupAddress: input.pickupAddress,
      pickupSuburb: input.pickupSuburb,
      pickupLat: input.pickupLat,
      pickupLng: input.pickupLng,
      dropoffAddress: input.dropoffAddress,
      dropoffSuburb: input.dropoffSuburb,
      dropoffLat: input.dropoffLat,
      dropoffLng: input.dropoffLng,
      scheduledStart,
      scheduledEnd,
      accessNotes,
      mobilityRequirements: mobilityJson,
      status: "open",
    },
  });

  const trip = await prisma.transportTrip.create({
    data: {
      tripRequestId: request.id,
      participantId: user.id,
      providerOrganisationId: input.providerOrganisationId,
      status: input.providerOrganisationId ? "provider_review" : "requested",
      pickupAddress: input.pickupAddress,
      pickupSuburb: input.pickupSuburb,
      pickupLat: input.pickupLat,
      pickupLng: input.pickupLng,
      dropoffAddress: input.dropoffAddress,
      dropoffSuburb: input.dropoffSuburb,
      dropoffLat: input.dropoffLat,
      dropoffLng: input.dropoffLng,
      accessNotes,
      scheduledStart,
      scheduledEnd,
      mobilityRequirements: mobilityJson,
    },
  });

  await prisma.transportTripStop.createMany({
    data: [
      {
        tripId: trip.id,
        sequence: 1,
        stopType: "pickup",
        label: "Pickup",
        address: input.pickupAddress,
        suburb: input.pickupSuburb,
        lat: input.pickupLat,
        lng: input.pickupLng,
        windowStart: scheduledStart,
        windowEnd: scheduledEnd,
      },
      {
        tripId: trip.id,
        sequence: 2,
        stopType: "dropoff",
        label: "Drop-off",
        address: input.dropoffAddress,
        suburb: input.dropoffSuburb,
        lat: input.dropoffLat,
        lng: input.dropoffLng,
      },
    ],
  });

  await recordTripEvent({
    tripId: trip.id,
    actorUserId: user.id,
    eventType: "created",
    toStatus: trip.status,
    participantId: trip.participantId,
    organisationId: trip.providerOrganisationId ?? undefined,
  });

  return buildTripResponse({ trip, user });
}

export async function listTransportTripsForUser(user: CurrentUser) {
  const { isAdminRole } = await import("@/lib/auth/roles");
  const { getUserOrganisationIds } = await import("@/lib/api/phase3-scope");

  let where = {};
  if (!isAdminRole(user.primaryRole)) {
    if (user.primaryRole === "driver") {
      const driver = await prisma.transportDriver.findFirst({
        where: { userId: user.id, active: true },
      });
      if (!driver) return [];
      const assignments = await prisma.transportDispatchAssignment.findMany({
        where: { driverId: driver.id, active: true },
        select: { tripId: true },
      });
      where = { id: { in: assignments.map((a) => a.tripId) } };
    } else if (
      user.primaryRole === "transport_operator" ||
      user.primaryRole === "provider_admin"
    ) {
      const orgIds = await getUserOrganisationIds(user.id);
      where = { providerOrganisationId: { in: orgIds } };
    } else {
      where = { participantId: user.id };
    }
  }

  const trips = await prisma.transportTrip.findMany({
    where,
    orderBy: { scheduledStart: "desc" },
    take: 100,
  });

  return Promise.all(trips.map((trip) => buildTripResponse({ trip, user })));
}

export async function getTransportTripForUser(user: CurrentUser, tripId: string) {
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");

  await assertCanAccessTrip(user, trip, "summary");

  await logDataAccess({
    actor: user,
    resourceType: "TransportTrip",
    resourceId: trip.id,
    accessType: "read_detail",
    participantId: trip.participantId,
    organisationId: trip.providerOrganisationId ?? undefined,
  });

  const estimate = await prisma.transportRouteEstimate.findFirst({
    where: { tripId: trip.id },
    orderBy: { createdAt: "desc" },
  });

  return buildTripResponse({ trip, user, routeEstimate: estimate });
}

export async function patchTransportTrip(
  user: CurrentUser,
  tripId: string,
  data: {
    scheduledStart?: string;
    scheduledEnd?: string;
    accessNotes?: string;
    mobilityRequirements?: Record<string, unknown>;
  }
) {
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  if (trip.participantId !== user.id) {
    throw new TransportApiError("TRANSPORT_ACCESS_DENIED");
  }

  const updated = await prisma.transportTrip.update({
    where: { id: tripId },
    data: {
      scheduledStart: data.scheduledStart
        ? new Date(data.scheduledStart)
        : undefined,
      scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
      accessNotes: data.accessNotes,
      mobilityRequirements: data.mobilityRequirements as
        | Prisma.InputJsonValue
        | undefined,
    },
  });

  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "updated",
    participantId: trip.participantId,
  });

  return buildTripResponse({ trip: updated, user });
}

async function transitionTrip(
  user: CurrentUser,
  tripId: string,
  toStatus: TransportTripStatus,
  extra?: { message?: string; disputeReason?: string }
) {
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");

  await assertCanAccessTrip(user, trip, "summary");
  assertStatusTransition(trip.status, toStatus);

  const updated = await prisma.transportTrip.update({
    where: { id: tripId },
    data: {
      status: toStatus,
      disputeReason: extra?.disputeReason ?? trip.disputeReason,
    },
  });

  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "status_changed",
    fromStatus: trip.status,
    toStatus,
    message: extra?.message,
    participantId: trip.participantId,
    organisationId: trip.providerOrganisationId ?? undefined,
  });

  if (toStatus === "trip_completed" || toStatus === "closed") {
    await bridgeTransportTripToBooking(updated);
  }

  return buildTripResponse({ trip: updated, user });
}

export async function cancelTransportTrip(
  user: CurrentUser,
  tripId: string,
  reason?: string
) {
  return transitionTrip(user, tripId, "cancelled", { message: reason });
}

export async function confirmTransportTrip(user: CurrentUser, tripId: string) {
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  if (trip.participantId !== user.id) {
    throw new TransportApiError("TRANSPORT_ACCESS_DENIED");
  }
  if (trip.status === "participant_review") {
    return transitionTrip(user, tripId, "closed", {
      message: "Participant confirmed",
    });
  }
  return transitionTrip(user, tripId, "participant_review", {
    message: "Participant acknowledged trip",
  });
}

export async function disputeTransportTrip(
  user: CurrentUser,
  tripId: string,
  reason: string
) {
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  if (trip.participantId !== user.id) {
    throw new TransportApiError("TRANSPORT_ACCESS_DENIED");
  }
  assertStatusTransition(trip.status, "disputed");
  const updated = await prisma.transportTrip.update({
    where: { id: tripId },
    data: { status: "disputed", disputeReason: reason },
  });
  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "disputed",
    fromStatus: trip.status,
    toStatus: "disputed",
    message: reason,
    participantId: trip.participantId,
  });
  return buildTripResponse({ trip: updated, user });
}

export async function listProviderTripRequests(user: CurrentUser, orgId: string) {
  await assertProviderOrgTrip(user, orgId);
  const requests = await prisma.transportTripRequest.findMany({
    where: {
      OR: [{ providerOrganisationId: orgId }, { providerOrganisationId: null }],
      status: "open",
    },
    orderBy: { scheduledStart: "asc" },
    take: 50,
  });
  return requests;
}

export async function listProviderTrips(user: CurrentUser, orgId: string) {
  await assertProviderOrgTrip(user, orgId);
  const trips = await prisma.transportTrip.findMany({
    where: { providerOrganisationId: orgId },
    orderBy: { scheduledStart: "desc" },
    take: 100,
  });
  return Promise.all(trips.map((t) => buildTripResponse({ trip: t, user })));
}

export async function providerAcceptTrip(
  user: CurrentUser,
  tripId: string,
  orgId: string
) {
  await assertProviderOrgTrip(user, orgId);
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (
    !trip ||
    (trip.providerOrganisationId && trip.providerOrganisationId !== orgId)
  ) {
    throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  }
  const nextStatus =
    trip.status === "requested" || trip.status === "provider_review"
      ? "accepted"
      : null;
  if (!nextStatus) {
    throw new TransportApiError("TRANSPORT_INVALID_STATUS_TRANSITION");
  }
  assertStatusTransition(trip.status, nextStatus);
  const updated = await prisma.transportTrip.update({
    where: { id: tripId },
    data: {
      status: nextStatus,
      providerOrganisationId: trip.providerOrganisationId ?? orgId,
    },
  });
  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "provider_accepted",
    fromStatus: trip.status,
    toStatus: nextStatus,
    organisationId: orgId,
    participantId: trip.participantId,
  });
  return buildTripResponse({ trip: updated, user });
}

export async function providerDeclineTrip(
  user: CurrentUser,
  tripId: string,
  orgId: string,
  reason?: string
) {
  await assertProviderOrgTrip(user, orgId);
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip || trip.providerOrganisationId !== orgId) {
    throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  }
  return transitionTrip(user, tripId, "declined", { message: reason });
}

export async function requestServiceRecovery(
  user: CurrentUser,
  tripId: string,
  orgId: string,
  reason: string
) {
  await assertProviderOrgTrip(user, orgId);
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip || trip.providerOrganisationId !== orgId) {
    throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  }
  return transitionTrip(user, tripId, "service_recovery_required", {
    message: reason,
  });
}
