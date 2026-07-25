import { describe, expect, it } from "vitest";

import {
  foundationalSupportsToGeoJson,
  listFoundationalSupportsNear,
} from "@/lib/navigator/foundational-supports-store";
import { FoundationalSupportSchema } from "@/lib/schemas/foundational-supports";

describe("foundational supports fixtures", () => {
  it("returns NSW fixtures near Sydney within large radius", () => {
    const items = listFoundationalSupportsNear({
      latitude: -33.8688,
      longitude: 151.2093,
      radiusKm: 80,
    });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(FoundationalSupportSchema.safeParse(item).success).toBe(true);
    }
  });

  it("filters by category", () => {
    const items = listFoundationalSupportsNear({
      latitude: -33.8688,
      longitude: 151.2093,
      radiusKm: 200,
      category: "PEER_NETWORK",
    });
    expect(items.every((i) => i.category === "PEER_NETWORK")).toBe(true);
  });

  it("emits GeoJSON with foundational_support kind", () => {
    const items = listFoundationalSupportsNear({
      latitude: -37.8136,
      longitude: 144.9631,
      radiusKm: 50,
    });
    const fc = foundationalSupportsToGeoJson(items);
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features.length).toBe(items.length);
    for (const f of fc.features) {
      expect(f.properties.kind).toBe("foundational_support");
      expect(f.geometry.type).toBe("Point");
      expect(f.geometry.coordinates).toHaveLength(2);
    }
  });

  it("returns empty when radius too small for distant markers", () => {
    const items = listFoundationalSupportsNear({
      latitude: 0,
      longitude: 0,
      radiusKm: 1,
    });
    expect(items).toHaveLength(0);
  });
});
