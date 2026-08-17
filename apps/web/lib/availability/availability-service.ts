import { prisma } from "@/lib/prisma";

export async function listAvailability(organisationId: string) {
  return prisma.availabilityWindow.findMany({
    where: { organisationId, active: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

export async function createAvailabilityWindow(params: {
  organisationId: string;
  workerProfileId?: string;
  driverProfileId?: string;
  vehicleId?: string;
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  startTime: string;
  endTime: string;
  timezone?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}) {
  return prisma.availabilityWindow.create({
    data: {
      organisationId: params.organisationId,
      workerProfileId: params.workerProfileId,
      driverProfileId: params.driverProfileId,
      vehicleId: params.vehicleId,
      dayOfWeek: params.dayOfWeek,
      startTime: params.startTime,
      endTime: params.endTime,
      timezone: params.timezone ?? "Australia/Sydney",
      effectiveFrom: params.effectiveFrom ?? new Date(),
      effectiveTo: params.effectiveTo,
      active: true,
    },
  });
}

export async function upsertCapacityBlock(params: {
  organisationId: string;
  date: Date;
  serviceType: string;
  totalCapacity: number;
  bookedCapacity?: number;
  notes?: string;
}) {
  const existing = await prisma.capacityBlock.findFirst({
    where: {
      organisationId: params.organisationId,
      date: params.date,
      serviceType: params.serviceType,
    },
  });
  if (existing) {
    return prisma.capacityBlock.update({
      where: { id: existing.id },
      data: {
        totalCapacity: params.totalCapacity,
        bookedCapacity: params.bookedCapacity,
        notes: params.notes,
      },
    });
  }
  return prisma.capacityBlock.create({
    data: {
      organisationId: params.organisationId,
      date: params.date,
      serviceType: params.serviceType,
      totalCapacity: params.totalCapacity,
      bookedCapacity: params.bookedCapacity ?? 0,
      notes: params.notes,
    },
  });
}
