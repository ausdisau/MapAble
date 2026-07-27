import type { TransportVerificationKind } from "@prisma/client";
import {
  evaluateDriverEligibility,
  evaluateVehicleEligibility,
  transportRequirementsSchema,
} from "@mapable/domain-transport";

import { prisma } from "@/lib/prisma";
import { parseMobilityRequirements } from "@/lib/transport/mobility-schema";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import type { EligibilityCheckResult } from "@/types/transport-scheduling";

const DRIVER_REQUIRED: TransportVerificationKind[] = [
  "licence",
  "screening",
  "training",
];

const VEHICLE_REQUIRED: TransportVerificationKind[] = [
  "registration",
  "insurance",
  "inspection",
];

function checkVerifications(
  records: Array<{ kind: TransportVerificationKind; status: string; expiresAt: Date | null }>,
  required: TransportVerificationKind[]
): string[] {
  const reasons: string[] = [];
  const now = new Date();
  for (const kind of required) {
    const rec = records.find((r) => r.kind === kind);
    if (!rec || rec.status !== "verified") {
      reasons.push(`${kind} is not verified`);
      continue;
    }
    if (rec.expiresAt && rec.expiresAt < now) {
      reasons.push(`${kind} has expired`);
    }
  }
  return reasons;
}

export async function checkDriverEligibility(
  driverId: string,
  options?: { requireAccessTraining?: boolean }
): Promise<EligibilityCheckResult> {
  const driver = await prisma.transportDriver.findUnique({
    where: { id: driverId },
    include: { verifications: true },
  });
  if (!driver || !driver.active) {
    return { eligible: false, reasons: ["Driver not found or inactive"] };
  }

  const required = [...DRIVER_REQUIRED];
  if (options?.requireAccessTraining) required.push("training");

  const requirements = transportRequirementsSchema.parse({
    requiredCommunicationCapabilities: [],
  });
  const result = evaluateDriverEligibility({
    driver: {
      id: driver.id,
      active: driver.active,
      communicationCapabilities: [],
      verifications: driver.verifications.map((record) => ({
        kind: record.kind,
        status: record.status,
        expiresAt: record.expiresAt?.toISOString() ?? null,
      })),
    },
    requirements,
  });
  const legacyReasons = checkVerifications(driver.verifications, required);
  return {
    eligible: result.eligible && legacyReasons.length === 0,
    reasons: [...legacyReasons, ...result.reasonCodes.map((reason) => reason.replace(/_/g, " ").toLowerCase())],
  };
}

export async function checkVehicleEligibility(
  vehicleId: string,
  mobilityRequirements?: Record<string, unknown>
): Promise<EligibilityCheckResult> {
  const vehicle = await prisma.transportVehicle.findUnique({
    where: { id: vehicleId },
    include: { verifications: true, features: true },
  });
  if (!vehicle || !vehicle.active) {
    return { eligible: false, reasons: ["Vehicle not found or inactive"] };
  }

  const reqs = parseMobilityRequirements(mobilityRequirements ?? {});
  const result = evaluateVehicleEligibility({
    vehicle: {
      id: vehicle.id,
      active: vehicle.active,
      features: vehicle.features[0]
        ? {
            wheelchairAccessible: vehicle.features[0].wheelchairAccessible,
            rampAvailable: vehicle.features[0].rampAvailable,
            liftAvailable: vehicle.features[0].liftAvailable,
            hoistAvailable: vehicle.features[0].hoistAvailable,
            assistanceAnimalFriendly: vehicle.features[0].assistanceAnimalFriendly,
          }
        : null,
      verifications: vehicle.verifications.map((record) => ({
        kind: record.kind,
        status: record.status,
        expiresAt: record.expiresAt?.toISOString() ?? null,
      })),
    },
    requirements: transportRequirementsSchema.parse(reqs),
  });
  const reasons = [
    ...checkVerifications(vehicle.verifications, VEHICLE_REQUIRED),
    ...result.reasonCodes.map((reason) => reason.replace(/_/g, " ").toLowerCase()),
  ];
  const feature = vehicle.features[0];
  if (reqs.requiresWheelchairAccessible && feature && !feature.wheelchairAccessible) {
    reasons.push("Vehicle is not wheelchair accessible");
  }
  if (reqs.requiresRamp && feature && !feature.rampAvailable && !feature.liftAvailable) {
    reasons.push("Vehicle does not have ramp or lift");
  }
  if (reqs.requiresLift && feature && !feature.liftAvailable) {
    reasons.push("Vehicle does not have a lift");
  }
  if (reqs.requiresHoist && feature && !feature.hoistAvailable) {
    reasons.push("Vehicle does not have a hoist");
  }

  const equipment = vehicle.verifications.find((v) => v.kind === "access_equipment");
  if (reqs.requiresAccessEquipment && equipment?.status !== "verified") {
    reasons.push("Access equipment verification missing");
  }
  if (
    reqs.assistanceAnimalPresent &&
    feature &&
    !feature.assistanceAnimalFriendly
  ) {
    reasons.push("Vehicle is not marked assistance-animal friendly");
  }

  return { eligible: reasons.length === 0, reasons };
}

export async function checkDriverEligibilityForTrip(
  driverId: string,
  mobilityRequirements?: Record<string, unknown>
): Promise<EligibilityCheckResult> {
  const reqs = parseMobilityRequirements(mobilityRequirements ?? {});
  const requireTraining =
    reqs.driverAssistanceRequired ||
    reqs.needsDriverAssistanceToDoor ||
    reqs.requiresWheelchairAccessible ||
    reqs.requiresHoist;
  return checkDriverEligibility(driverId, {
    requireAccessTraining: requireTraining,
  });
}

export async function assertDriverEligible(
  driverId: string,
  mobilityRequirements?: Record<string, unknown>
) {
  const result = await checkDriverEligibilityForTrip(driverId, mobilityRequirements);
  if (!result.eligible) {
    throw new TransportApiError("TRANSPORT_DRIVER_NOT_ELIGIBLE", undefined, result);
  }
}

export async function assertVehicleEligible(
  vehicleId: string,
  mobilityRequirements?: Record<string, unknown>
) {
  const result = await checkVehicleEligibility(vehicleId, mobilityRequirements);
  if (!result.eligible) {
    throw new TransportApiError("TRANSPORT_VEHICLE_NOT_ELIGIBLE", undefined, result);
  }
}
