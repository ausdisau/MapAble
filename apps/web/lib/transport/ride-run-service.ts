import type { RideRunStatus } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { transportAccessibleConfig } from "@/lib/config/transport-accessible";
import { prisma } from "@/lib/prisma";
import { parseMobilityRequirements } from "@/lib/transport/mobility-schema";
import { assertProviderOrgTrip } from "@/lib/transport/transport-access-policy";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import {
  checkVehicleEligibility,
} from "@/lib/transport/transport-eligibility-service";

export async function createRideRun(
  user: CurrentUser,
  orgId: string,
  input: {
    vehicleId: string;
    driverId?: string;
    scheduledStart: string;
    scheduledEnd?: string;
    maxPassengers?: number;
    notes?: string;
  }
) {
  if (!transportAccessibleConfig.ridePoolingEnabled) {
    throw new TransportApiError(
      "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
      "Ride pooling is not enabled."
    );
  }

  await assertProviderOrgTrip(user, orgId);

  const vehicle = await prisma.transportVehicle.findFirst({
    where: { id: input.vehicleId, organisationId: orgId, active: true },
  });
  if (!vehicle) {
    throw new TransportApiError("TRANSPORT_VALIDATION_FAILED");
  }

  return prisma.rideRun.create({
    data: {
      providerOrganisationId: orgId,
      vehicleId: input.vehicleId,
      driverId: input.driverId,
      scheduledStart: new Date(input.scheduledStart),
      scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : undefined,
      maxPassengers: input.maxPassengers ?? 4,
      status: "planning",
      notes: input.notes,
      requiresHumanReview: true,
    },
    include: { trips: true, vehicle: true, driver: true },
  });
}

export async function attachTripToRideRun(
  user: CurrentUser,
  orgId: string,
  rideRunId: string,
  tripId: string
) {
  if (!transportAccessibleConfig.ridePoolingEnabled) {
    throw new TransportApiError(
      "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
      "Ride pooling is not enabled."
    );
  }

  await assertProviderOrgTrip(user, orgId);

  const run = await prisma.rideRun.findFirst({
    where: { id: rideRunId, providerOrganisationId: orgId },
    include: { trips: true },
  });
  if (!run) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");

  if (run.status === "locked" || run.status === "in_progress") {
    throw new TransportApiError(
      "TRANSPORT_INVALID_STATUS_TRANSITION",
      "Cannot attach trips to a locked or active run."
    );
  }

  if (run.trips.length >= run.maxPassengers) {
    throw new TransportApiError(
      "TRANSPORT_VALIDATION_FAILED",
      "Ride run is at passenger capacity."
    );
  }

  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip || trip.providerOrganisationId !== orgId) {
    throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  }

  if (trip.rideRunId && trip.rideRunId !== rideRunId) {
    throw new TransportApiError(
      "TRANSPORT_VALIDATION_FAILED",
      "Trip is already attached to another run."
    );
  }

  const mobility = parseMobilityRequirements(trip.mobilityRequirements);
  const vehicleCheck = await checkVehicleEligibility(run.vehicleId, mobility);
  if (!vehicleCheck.eligible) {
    throw new TransportApiError("TRANSPORT_VEHICLE_NOT_ELIGIBLE", undefined, {
      reasons: vehicleCheck.reasons,
    });
  }

  for (const other of run.trips) {
    const otherMobility = parseMobilityRequirements(other.mobilityRequirements);
    const merged = { ...otherMobility, ...mobility };
    const check = await checkVehicleEligibility(run.vehicleId, merged);
    if (!check.eligible) {
      throw new TransportApiError(
        "TRANSPORT_VEHICLE_NOT_ELIGIBLE",
        "Vehicle cannot satisfy combined mobility needs for all passengers.",
        { reasons: check.reasons }
      );
    }
  }

  await prisma.transportTrip.update({
    where: { id: tripId },
    data: { rideRunId },
  });

  return prisma.rideRun.findUnique({
    where: { id: rideRunId },
    include: { trips: true, vehicle: true, driver: true },
  });
}

export async function lockRideRun(
  user: CurrentUser,
  orgId: string,
  rideRunId: string
) {
  await assertProviderOrgTrip(user, orgId);
  const run = await prisma.rideRun.findFirst({
    where: { id: rideRunId, providerOrganisationId: orgId },
  });
  if (!run) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");

  return prisma.rideRun.update({
    where: { id: rideRunId },
    data: { status: "locked" as RideRunStatus, requiresHumanReview: false },
    include: { trips: true },
  });
}

export async function listRideRuns(user: CurrentUser, orgId: string) {
  await assertProviderOrgTrip(user, orgId);
  return prisma.rideRun.findMany({
    where: { providerOrganisationId: orgId },
    orderBy: { scheduledStart: "desc" },
    include: { trips: true, vehicle: true, driver: true },
    take: 50,
  });
}
