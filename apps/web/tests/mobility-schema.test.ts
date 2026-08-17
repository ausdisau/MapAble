import { describe, expect, it } from "vitest";

import {
  mobilityFromAccessibilityProfile,
  normalizeMobilityRequirements,
  parseMobilityRequirements,
} from "@/lib/transport/mobility-schema";

describe("mobility schema", () => {
  it("maps accessibility profile to trip mobility", () => {
    const result = mobilityFromAccessibilityProfile({
      transportRequirements: {
        requiresWheelchairAccessibleVehicle: true,
        needsDriverAssistanceToDoor: true,
        assistanceAnimalPresent: true,
      },
      mobilityNeeds: ["assistance_animal"],
    });
    expect(result.requiresWheelchairAccessible).toBe(true);
    expect(result.driverAssistanceRequired).toBe(true);
    expect(result.assistanceAnimalPresent).toBe(true);
  });

  it("normalizes wheelchair to require ramp when missing", () => {
    const result = normalizeMobilityRequirements({
      requiresWheelchairAccessible: true,
    });
    expect(result.requiresRamp).toBe(true);
  });

  it("parses legacy keys safely", () => {
    const result = parseMobilityRequirements({
      requiresWheelchairAccessible: true,
      unknownKey: "x",
    });
    expect(result.requiresWheelchairAccessible).toBe(true);
    expect((result as Record<string, unknown>).unknownKey).toBeUndefined();
  });
});
