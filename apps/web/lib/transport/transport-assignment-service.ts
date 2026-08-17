import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import {
  assertAssignedDriver,
  assertProviderOrgTrip,
} from "@/lib/transport/transport-access-policy";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import {
  assertDriverEligible,
  assertVehicleEligible,
} from "@/lib/transport/transport-eligibility-service";
import { recordTripEvent } from "@/lib/transport/transport-event-service";
import { buildTripResponse } from "@/lib/transport/transport-response";
import { assertNoScheduleConflict } from "@/lib/transport/transport-schedule-conflict-service";
import { assertStatusTransition } from "@/lib/transport/transport-status-service";

function tripEnd(trip: { scheduledStart: Date; scheduledEnd: Date | null }) {
  return trip.scheduledEnd ?? new Date(trip.scheduledStart.getTime() + 3600000);
}

export async function assignDriverAndVehicle(
  user: CurrentUser,
  tripId: string,
  orgId: string,
  driverId: string,
  vehicleId: string
) {
  await assertProviderOrgTrip(user, orgId);
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip || trip.providerOrganisationId !== orgId) {
    throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  }

  const driver = await prisma.transportDriver.findFirst({
    where: { id: driverId, organisationId: orgId, active: true },
  });
  const vehicle = await prisma.transportVehicle.findFirst({
    where: { id: vehicleId, organisationId: orgId, active: true },
  });
  if (!driver || !vehicle) {
    throw new TransportApiError("TRANSPORT_VALIDATION_FAILED");
  }

  const mobility = (trip.mobilityRequirements as Record<string, unknown>) ?? {};
  await assertDriverEligible(driverId, mobility);
  await assertVehicleEligible(vehicleId, mobility);

  const end = tripEnd(trip);
  await assertNoScheduleConflict({
    tripId,
    driverId,
    vehicleId,
    scheduledStart: trip.scheduledStart,
    scheduledEnd: end,
  });

  await prisma.transportDispatchAssignment.updateMany({
    where: { tripId, active: true },
    data: { active: false, unassignedAt: new Date() },
  });

  await prisma.transportDispatchAssignment.create({
    data: {
      tripId,
      organisationId: orgId,
      driverId,
      vehicleId,
      assignedByUserId: user.id,
      active: true,
    },
  });

  assertStatusTransition(trip.status, "driver_vehicle_assigned");
  const updated = await prisma.transportTrip.update({
    where: { id: tripId },
    data: { status: "driver_vehicle_assigned" },
  });

  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "assigned",
    fromStatus: trip.status,
    toStatus: "driver_vehicle_assigned",
    metadata: { driverId, vehicleId },
    organisationId: orgId,
    participantId: trip.participantId,
  });

  return buildTripResponse({ trip: updated, user });
}

export async function unassignTrip(user: CurrentUser, tripId: string, orgId: string) {
  await assertProviderOrgTrip(user, orgId);
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip || trip.providerOrganisationId !== orgId) {
    throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  }

  await prisma.transportDispatchAssignment.updateMany({
    where: { tripId, active: true },
    data: { active: false, unassignedAt: new Date() },
  });

  const updated = await prisma.transportTrip.update({
    where: { id: tripId },
    data: { status: "dispatch_pending" },
  });

  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "unassigned",
    fromStatus: trip.status,
    toStatus: "dispatch_pending",
    organisationId: orgId,
    participantId: trip.participantId,
  });

  return buildTripResponse({ trip: updated, user });
}

export async function driverAcceptTrip(user: CurrentUser, tripId: string) {
  const driver = await assertAssignedDriver(user, tripId);
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");

  assertStatusTransition(trip.status, "driver_accepted");
  const updated = await prisma.transportTrip.update({
    where: { id: tripId },
    data: { status: "driver_accepted" },
  });

  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "driver_accepted",
    fromStatus: trip.status,
    toStatus: "driver_accepted",
    metadata: { driverId: driver.id },
    participantId: trip.participantId,
    organisationId: trip.providerOrganisationId ?? undefined,
  });

  return buildTripResponse({ trip: updated, user });
}

export async function driverRejectTrip(
  user: CurrentUser,
  tripId: string,
  reason?: string
) {
  await assertAssignedDriver(user, tripId);
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");

  await prisma.transportDispatchAssignment.updateMany({
    where: { tripId, active: true },
    data: { active: false, unassignedAt: new Date() },
  });

  const updated = await prisma.transportTrip.update({
    where: { id: tripId },
    data: { status: "dispatch_pending" },
  });

  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "driver_rejected",
    fromStatus: trip.status,
    toStatus: "dispatch_pending",
    message: reason,
    participantId: trip.participantId,
  });

  return buildTripResponse({ trip: updated, user });
}

export async function driverUpdateTripStatus(
  user: CurrentUser,
  tripId: string,
  status: import("@prisma/client").TransportTripStatus,
  message?: string
) {
  await assertAssignedDriver(user, tripId);
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");

  assertStatusTransition(trip.status, status, { driverOnly: true });

  const updated = await prisma.transportTrip.update({
    where: { id: tripId },
    data: { status },
  });

  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "driver_status",
    fromStatus: trip.status,
    toStatus: status,
    message,
    participantId: trip.participantId,
    organisationId: trip.providerOrganisationId ?? undefined,
  });

  return buildTripResponse({ trip: updated, user });
}

export async function recordDriverLocation(
  user: CurrentUser,
  tripId: string,
  lat: number,
  lng: number
) {
  const driver = await assertAssignedDriver(user, tripId);
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");

  const activeStatuses = [
    "en_route_to_pickup",
    "arrived_at_pickup",
    "participant_boarded",
    "en_route_to_dropoff",
    "arrived_at_dropoff",
  ];
  if (!activeStatuses.includes(trip.status)) {
    throw new TransportApiError("TRANSPORT_ACCESS_DENIED");
  }

  await prisma.transportLiveLocation.create({
    data: { tripId, driverId: driver.id, lat, lng },
  });

  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "location_update",
    metadata: { lat, lng },
    participantId: trip.participantId,
  });

  return { ok: true };
}

export async function getDriverTrips(user: CurrentUser) {
  const driver = await prisma.transportDriver.findFirst({
    where: { userId: user.id, active: true },
  });
  if (!driver) return [];

  const assignments = await prisma.transportDispatchAssignment.findMany({
    where: { driverId: driver.id, active: true },
    include: { trip: true },
  });

  return Promise.all(
    assignments.map((a) => buildTripResponse({ trip: a.trip, user }))
  );
}

export async function getDriverTrip(user: CurrentUser, tripId: string) {
  await assertAssignedDriver(user, tripId);
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  return buildTripResponse({ trip, user });
}
