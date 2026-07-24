import { describe, expect, it } from "vitest";

import { toPublicVenueSpec } from "@/lib/offline/public-venue-dto";
import { DEMO_ACCESS_PLACES } from "@/lib/demo/accessibility-places";

describe("public venue DTO minimisation", () => {
  it("exposes access measurements without private fields", () => {
    const place = DEMO_ACCESS_PLACES[0];
    const dto = toPublicVenueSpec(place);

    expect(dto.id).toBe(place.id);
    expect(dto.slug).toBe(place.slug);
    expect(dto.doorWidthMm).toBe(place.profile.doorWidthMm);
    expect(dto.measurements.length).toBeGreaterThan(0);
    expect(dto).not.toHaveProperty("profile");
    expect(dto).not.toHaveProperty("domains");
  });
});
