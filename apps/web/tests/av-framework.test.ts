import { describe, expect, it } from "vitest";

import {
  avTripTransitionAllowed,
  checkAvVehicleSuitability,
  AV_CAPABILITY_MATRIX,
} from "@/lib/platform/av-framework";

describe("av-framework", () => {
  it("allows requested → provider_review", () => {
    expect(
      avTripTransitionAllowed("requested", "provider_review")
    ).toBe(true);
  });

  it("blocks requested → trip_completed", () => {
    expect(avTripTransitionAllowed("requested", "trip_completed")).toBe(
      false
    );
  });

  it("flags wheelchair mismatch", () => {
    const result = checkAvVehicleSuitability(
      { requiresWheelchairAccessible: true },
      { wheelchairAccessible: false }
    );
    expect(result.suitable).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("disallows autonomous dispatch capability", () => {
    expect(AV_CAPABILITY_MATRIX.autonomous_dispatch.allowed).toBe(false);
  });
});
