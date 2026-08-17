import { prisma } from "@/lib/prisma";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import type { ScheduleConflictResult } from "@/types/transport-scheduling";

export async function detectScheduleConflicts(params: {
  tripId?: string;
  driverId?: string;
  vehicleId?: string;
  scheduledStart: Date;
  scheduledEnd: Date;
}): Promise<ScheduleConflictResult> {
  const conflicts: ScheduleConflictResult["conflicts"] = [];

  if (params.driverId) {
    const overlappingTrips = await prisma.transportDispatchAssignment.findMany({
      where: {
        active: true,
        driverId: params.driverId,
        trip: {
          id: params.tripId ? { not: params.tripId } : undefined,
          status: {
            notIn: ["cancelled", "declined", "closed"],
          },
          scheduledStart: { lt: params.scheduledEnd },
          OR: [
            { scheduledEnd: { gt: params.scheduledStart } },
            { scheduledEnd: null },
          ],
        },
      },
      include: { trip: true },
    });

    for (const a of overlappingTrips) {
      conflicts.push({
        conflictType: "driver_trip_overlap",
        details: `Driver assigned to trip ${a.tripId} at overlapping time`,
      });
    }

    const unavailable = await prisma.transportDriverAvailability.findFirst({
      where: {
        driverId: params.driverId,
        available: false,
        startAt: { lte: params.scheduledEnd },
        endAt: { gte: params.scheduledStart },
      },
    });
    if (unavailable) {
      conflicts.push({
        conflictType: "driver_unavailable",
        details: "Driver marked unavailable for this window",
      });
    }
  }

  if (params.vehicleId) {
    const overlappingVehicle = await prisma.transportDispatchAssignment.findMany({
      where: {
        active: true,
        vehicleId: params.vehicleId,
        trip: {
          id: params.tripId ? { not: params.tripId } : undefined,
          status: { notIn: ["cancelled", "declined", "closed"] },
          scheduledStart: { lt: params.scheduledEnd },
          scheduledEnd: { gt: params.scheduledStart },
        },
      },
    });
    for (const a of overlappingVehicle) {
      conflicts.push({
        conflictType: "vehicle_trip_overlap",
        details: `Vehicle assigned to trip ${a.tripId} at overlapping time`,
      });
    }
  }

  return { hasConflict: conflicts.length > 0, conflicts };
}

export async function assertNoScheduleConflict(params: {
  tripId?: string;
  driverId?: string;
  vehicleId?: string;
  scheduledStart: Date;
  scheduledEnd: Date;
}) {
  const result = await detectScheduleConflicts(params);
  if (result.hasConflict) {
    await prisma.transportScheduleConflict.createMany({
      data: result.conflicts.map((c) => ({
        tripId: params.tripId,
        driverId: params.driverId,
        vehicleId: params.vehicleId,
        conflictType: c.conflictType,
        details: c.details,
      })),
    });
    throw new TransportApiError("TRANSPORT_SCHEDULE_CONFLICT", undefined, result);
  }
}
