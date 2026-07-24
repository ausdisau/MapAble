import { describe, expect, it } from "vitest";

import {
  buildPlaceAccessibilityJsonLd,
  serializePlaceJsonLd,
} from "@/lib/access/place-json-ld";
import { resolveAccessDataSourceKind } from "@/components/access/AccessDataSourceMarker";

describe("buildPlaceAccessibilityJsonLd", () => {
  it("exposes Place/LocalBusiness accessibility features", () => {
    const jsonLd = buildPlaceAccessibilityJsonLd({
      name: "Parramatta City Library",
      url: "https://mapable.com.au/accessibility-map/parramatta-city-library",
      suburb: "Parramatta",
      state: "NSW",
      latitude: -33.8,
      longitude: 151.0,
      doorWidthMm: 920,
      stepFreeEntry: true,
      accessibleToilet: true,
      accessibleParking: true,
      hearingLoop: true,
      lastChecked: "2026-05-12",
    });

    expect(jsonLd["@type"]).toEqual(["Place", "LocalBusiness"]);
    expect(jsonLd.name).toBe("Parramatta City Library");
    expect(jsonLd.dateModified).toBe("2026-05-12");
    expect(jsonLd.geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: -33.8,
      longitude: 151.0,
    });
    const props = jsonLd.additionalProperty as Array<{ value: string }>;
    expect(props.map((p) => p.value)).toEqual(
      expect.arrayContaining([
        "StepFreeEntrance",
        "AccessibleToilet",
        "AccessibleParking",
        "HearingLoop",
        "DoorClearWidthMm:920",
      ]),
    );
  });

  it("escapes script-breaking characters when serializing", () => {
    const serialized = serializePlaceJsonLd({
      name: "Cafe </script><img>",
    });
    expect(serialized).toContain("\\u003c");
    expect(serialized).not.toContain("</script>");
  });
});

describe("resolveAccessDataSourceKind", () => {
  it("marks demo records explicitly", () => {
    expect(
      resolveAccessDataSourceKind({
        isDemo: true,
        source: "MapAble assessor",
        tier: "Gold",
      }),
    ).toBe("demo");
  });

  it("maps assessor and community sources", () => {
    expect(
      resolveAccessDataSourceKind({ source: "MapAble assessor", tier: "Silver" }),
    ).toBe("mapable_verified");
    expect(resolveAccessDataSourceKind({ source: "community" })).toBe(
      "community",
    );
  });
});
