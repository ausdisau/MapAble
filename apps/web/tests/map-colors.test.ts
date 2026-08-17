import { describe, expect, it } from "vitest";

import { getMapMarkerColors, getProviderCirclePaint } from "@/lib/map/map-colors";

describe("map marker colors", () => {
  it("returns fallback hsl values on the server", () => {
    const colors = getMapMarkerColors();
    expect(colors.primary).toMatch(/^hsl\(/);
    expect(colors.secondary).toMatch(/^hsl\(/);
    expect(colors.destructive).toMatch(/^hsl\(/);
  });

  it("builds MapLibre circle paint from token colors", () => {
    const paint = getProviderCirclePaint();
    expect(paint?.["circle-color"]).toMatch(/^hsl\(/);
    expect(paint?.["circle-stroke-color"]).toBe("#ffffff");
  });
});
