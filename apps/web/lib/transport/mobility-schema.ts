import { z } from "zod";

/**
 * Canonical mobility requirements for transport trips, eligibility, and UI.
 * Snapshot on trip create; may originate from AccessibilityProfile.transportRequirements.
 */
export const mobilityRequirementsSchema = z
  .object({
    requiresWheelchairAccessible: z.boolean().optional(),
    canTransferFromWheelchair: z.boolean().optional(),
    requiresRamp: z.boolean().optional(),
    requiresHoist: z.boolean().optional(),
    requiresLift: z.boolean().optional(),
    requiresAccessEquipment: z.boolean().optional(),
    assistanceAnimalPresent: z.boolean().optional(),
    driverAssistanceRequired: z.boolean().optional(),
    needsDriverAssistanceToDoor: z.boolean().optional(),
    needsExtraBoardingTime: z.boolean().optional(),
    passengerCount: z.number().int().min(1).max(8).optional(),
    mobilityAidNotes: z.string().max(2000).optional(),
    pickupNotes: z.string().max(2000).optional(),
    dropoffNotes: z.string().max(2000).optional(),
  })
  .partial();

export type MobilityRequirements = z.infer<typeof mobilityRequirementsSchema>;

export function parseMobilityRequirements(
  input: unknown
): MobilityRequirements {
  if (!input || typeof input !== "object") return {};
  const parsed = mobilityRequirementsSchema.safeParse(input);
  return parsed.success ? parsed.data : {};
}

export function normalizeMobilityRequirements(
  input: MobilityRequirements
): MobilityRequirements {
  const out: MobilityRequirements = { ...input };
  if (out.requiresWheelchairAccessible && !out.requiresRamp && !out.requiresLift) {
    out.requiresRamp = true;
  }
  if (out.needsDriverAssistanceToDoor && out.driverAssistanceRequired === undefined) {
    out.driverAssistanceRequired = true;
  }
  return out;
}

/** Map accessibility profile transportRequirements → trip mobility snapshot */
export function mobilityFromAccessibilityProfile(profile: {
  transportRequirements?: Record<string, unknown> | null;
  mobilityNeeds?: string[] | null;
}): MobilityRequirements {
  const tr = (profile.transportRequirements ?? {}) as Record<string, unknown>;
  const needs = profile.mobilityNeeds ?? [];
  const reqs: MobilityRequirements = {
    requiresWheelchairAccessible:
      tr.requiresWheelchairAccessibleVehicle === true
        ? true
        : undefined,
    canTransferFromWheelchair:
      tr.canTransferFromWheelchair === true ? true : undefined,
    requiresRamp: tr.requiresRamp === true ? true : undefined,
    requiresHoist: tr.requiresHoist === true ? true : undefined,
    driverAssistanceRequired:
      tr.needsDriverAssistanceToDoor === true ? true : undefined,
    needsDriverAssistanceToDoor:
      tr.needsDriverAssistanceToDoor === true ? true : undefined,
    needsExtraBoardingTime:
      tr.needsExtraBoardingTime === true ? true : undefined,
    assistanceAnimalPresent:
      tr.assistanceAnimalPresent === true ||
      needs.includes("assistance_animal")
        ? true
        : undefined,
    pickupNotes:
      typeof tr.pickupNotes === "string" ? tr.pickupNotes : undefined,
    dropoffNotes:
      typeof tr.dropoffNotes === "string" ? tr.dropoffNotes : undefined,
  };
  if (
    needs.some((m) =>
      ["manual_wheelchair", "power_wheelchair", "mobility_scooter"].includes(m)
    )
  ) {
    reqs.requiresWheelchairAccessible = true;
  }
  return normalizeMobilityRequirements(reqs);
}

export const MOBILITY_FIELD_LABELS: Record<keyof MobilityRequirements, string> = {
  requiresWheelchairAccessible: "Wheelchair-accessible vehicle",
  canTransferFromWheelchair: "Can transfer from wheelchair",
  requiresRamp: "Ramp access",
  requiresHoist: "Hoist required",
  requiresLift: "Lift required",
  requiresAccessEquipment: "Verified access equipment",
  assistanceAnimalPresent: "Assistance animal",
  driverAssistanceRequired: "Driver assistance",
  needsDriverAssistanceToDoor: "Assistance to door",
  needsExtraBoardingTime: "Extra boarding time",
  passengerCount: "Passengers",
  mobilityAidNotes: "Mobility notes",
  pickupNotes: "Pickup notes",
  dropoffNotes: "Drop-off notes",
};
