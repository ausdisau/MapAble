import { describe, expect, it } from "vitest";

import { entitiesToGeoJSON } from "@/lib/map/geojson";
import { providersToGeoJSON } from "@/lib/map/map-feature-query";

describe("entitiesToGeoJSON", () => {
  it("builds point features with kind and coordinates", () => {
    const fc = entitiesToGeoJSON([
      {
        id: "p1",
        kind: "provider",
        name: "Test Co",
        lat: -33.87,
        lng: 151.21,
        subtitle: "Sydney, NSW",
      },
    ]);
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0]?.geometry.coordinates).toEqual([151.21, -33.87]);
    expect(fc.features[0]?.properties?.kind).toBe("provider");
    expect(fc.features[0]?.properties?.name).toBe("Test Co");
  });
});

describe("providersToGeoJSON", () => {
  it("wraps providers as provider-kind features", () => {
    const fc = providersToGeoJSON([
      { id: "a", name: "A", lat: 1, lng: 2, suburb: "X", state: "NSW" },
    ]);
    expect(fc.features[0]?.properties?.kind).toBe("provider");
  });
});
