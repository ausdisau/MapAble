import type { Vehicle } from "@prisma/client";

export function getVehicleSuitabilityWarnings(
  requirements: {
    requiresWheelchairAccessible?: boolean;
    requiresRamp?: boolean;
    requiresLift?: boolean;
    assistanceAnimal?: boolean;
  },
  vehicle: Pick<
    Vehicle,
    | "wheelchairAccessible"
    | "rampAvailable"
    | "liftAvailable"
    | "assistanceAnimalFriendly"
  > | null
): string[] {
  if (!vehicle) return ["No vehicle assigned yet."];
  const warnings: string[] = [];
  if (requirements.requiresWheelchairAccessible && !vehicle.wheelchairAccessible) {
    warnings.push("Vehicle is not marked wheelchair accessible.");
  }
  if (requirements.requiresRamp && !vehicle.rampAvailable) {
    warnings.push("Vehicle does not have a ramp.");
  }
  if (requirements.requiresLift && !vehicle.liftAvailable) {
    warnings.push("Vehicle does not have a lift.");
  }
  if (requirements.assistanceAnimal && !vehicle.assistanceAnimalFriendly) {
    warnings.push("Vehicle may not be assistance animal friendly.");
  }
  return warnings;
}
