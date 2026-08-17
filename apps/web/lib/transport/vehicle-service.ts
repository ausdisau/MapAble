import type { VehicleType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function createVehicle(params: {
  organisationId: string;
  displayName: string;
  vehicleType: VehicleType;
  registrationNumber?: string;
  wheelchairAccessible?: boolean;
  rampAvailable?: boolean;
  liftAvailable?: boolean;
  wheelchairSpaces?: number;
  seatedPassengerCapacity?: number;
  canCarryPowerWheelchair?: boolean;
  assistanceAnimalFriendly?: boolean;
  airConditioning?: boolean;
  notes?: string;
  actorUserId: string;
}) {
  const vehicle = await prisma.vehicle.create({
    data: {
      organisationId: params.organisationId,
      displayName: params.displayName,
      vehicleType: params.vehicleType,
      registrationNumber: params.registrationNumber,
      wheelchairAccessible: params.wheelchairAccessible ?? false,
      rampAvailable: params.rampAvailable ?? false,
      liftAvailable: params.liftAvailable ?? false,
      wheelchairSpaces: params.wheelchairSpaces ?? 0,
      seatedCapacity: params.seatedPassengerCapacity ?? 4,
      canCarryPowerWheelchair: params.canCarryPowerWheelchair ?? false,
      assistanceAnimalFriendly: params.assistanceAnimalFriendly ?? true,
      airConditioning: params.airConditioning ?? true,
      notes: params.notes,
      verificationStatus: "pending_review",
      active: true,
    },
  });
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "vehicle.created",
    entityType: "Vehicle",
    entityId: vehicle.id,
    organisationId: params.organisationId,
  });
  return vehicle;
}

export async function verifyVehicle(
  vehicleId: string,
  verificationStatus: "verified" | "rejected" | "pending_review",
  adminUserId: string
) {
  const vehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { verificationStatus },
  });
  await createAuditEvent({
    actorUserId: adminUserId,
    action: "vehicle.verification_updated",
    entityType: "Vehicle",
    entityId: vehicleId,
    organisationId: vehicle.organisationId,
  });
  return vehicle;
}
