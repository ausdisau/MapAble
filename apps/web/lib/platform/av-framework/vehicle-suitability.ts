export type AvVehicleRequirements = {
  requiresWheelchairAccessible?: boolean;
  requiresRamp?: boolean;
  requiresLift?: boolean;
  assistanceAnimal?: boolean;
};

export type AvVehicleCapabilities = {
  wheelchairAccessible?: boolean;
  rampAvailable?: boolean;
  liftAvailable?: boolean;
  assistanceAnimalFriendly?: boolean;
};

export function checkAvVehicleSuitability(
  requirements: AvVehicleRequirements,
  vehicle: AvVehicleCapabilities | null
): { suitable: boolean; warnings: string[] } {
  if (!vehicle) {
    return { suitable: false, warnings: ["No vehicle assigned yet."] };
  }
  const warnings: string[] = [];
  if (
    requirements.requiresWheelchairAccessible &&
    !vehicle.wheelchairAccessible
  ) {
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
  return { suitable: warnings.length === 0, warnings };
}
