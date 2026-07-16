import { describe, expect, it } from "vitest";

import {
  getDemoFloorPlanDetail,
  getDemoFloorPlanSummaries,
  demoVenueHasFloorPlan,
} from "@/lib/demo/floor-plan-fixture";
import { isValidNormalizedPoint, normalizedToPercent } from "@/lib/floor-plan/coordinates";
import {
  floorPlanDocumentSchema,
  floorPlanFeatureSchema,
} from "@/lib/floor-plan/schemas";
import { isRouteAvailable, sortFloors } from "@/lib/floor-plan/route-utils";
import { filterFeaturesForDisplay } from "@/components/accessibility-map/floor-plan/FloorPlanTextAlternative";
import { parseFloorPlanSearchParams, buildFloorPlanPath } from "@/lib/floor-plan/floor-plan-url-state";

describe("floor plan schemas", () => {
  it("parses valid normalized points", () => {
    expect(isValidNormalizedPoint({ x: 0.5, y: 0.5 })).toBe(true);
    expect(isValidNormalizedPoint({ x: 1.5, y: 0.5 })).toBe(false);
    expect(isValidNormalizedPoint({ x: -0.1, y: 0.5 })).toBe(false);
  });

  it("rejects invalid feature positions in schema", () => {
    const result = floorPlanFeatureSchema.safeParse({
      id: "f1",
      floorPlanId: "fp1",
      type: "lift",
      name: "Lift",
      position: { x: 2, y: 0.5 },
      status: "verified",
    });
    expect(result.success).toBe(false);
  });

  it("parses demo floor plan document", () => {
    const detail = getDemoFloorPlanDetail("demo-parramatta-library", "demo-parramatta-ground");
    expect(detail).not.toBeNull();
    const doc = floorPlanDocumentSchema.safeParse({
      schemaVersion: 1 as const,
      features: detail!.plan.features,
      zones: detail!.plan.zones,
      routes: detail!.plan.routes,
      connectors: detail!.plan.connectors,
    });
    expect(doc.success).toBe(true);
  });
});

describe("floor plan coordinates", () => {
  it("converts normalized to percent", () => {
    expect(normalizedToPercent({ x: 0.5, y: 0.25 })).toEqual({
      left: "50.0000%",
      top: "25.0000%",
    });
  });
});

describe("floor plan demo fixture", () => {
  it("returns summaries for parramatta library", () => {
    const summaries = getDemoFloorPlanSummaries("demo-parramatta-library");
    expect(summaries?.hasFloorPlan).toBe(true);
    expect(summaries?.floorPlanCount).toBe(2);
  });

  it("returns null for venue without floor plan", () => {
    expect(demoVenueHasFloorPlan("demo-newtown-cafe")).toBe(false);
    expect(getDemoFloorPlanSummaries("demo-newtown-cafe")).toBeNull();
  });
});

describe("floor plan routes", () => {
  it("detects unavailable route when feature is closed", () => {
    const detail = getDemoFloorPlanDetail("demo-parramatta-library", "demo-parramatta-ground")!;
    const route = detail.plan.routes[0];
    const features = detail.plan.features.map((f) =>
      f.id === "feat-ground-lift"
        ? { ...f, operationalStatus: "temporarily_closed" as const }
        : f,
    );
    expect(isRouteAvailable(route, features)).toBe(false);
  });

  it("sorts floors by sortOrder", () => {
    const summaries = getDemoFloorPlanSummaries("demo-parramatta-library")!;
    const sorted = sortFloors(summaries.plans);
    expect(sorted[0].floorCode).toBe("G");
    expect(sorted[1].floorCode).toBe("1");
  });
});

describe("feature filtering", () => {
  it("filters by category and preserves selection", () => {
    const detail = getDemoFloorPlanDetail("demo-parramatta-library", "demo-parramatta-ground")!;
    const filtered = filterFeaturesForDisplay(
      detail.plan.features,
      new Set(["toilets"]),
      "",
      "feat-reception",
    );
    expect(filtered.some((f) => f.id === "feat-reception")).toBe(true);
    expect(filtered.every((f) => f.type.includes("toilet") || f.id === "feat-reception")).toBe(true);
  });
});

describe("floor plan URL state", () => {
  it("parses and builds deep link paths", () => {
    const params = new URLSearchParams("floor=demo-parramatta-ground&feature=feat-ground-toilet&view=text");
    expect(parseFloorPlanSearchParams(params)).toEqual({
      venueId: undefined,
      floorId: "demo-parramatta-ground",
      featureId: "feat-ground-toilet",
      routeId: undefined,
      view: "text",
    });
    expect(buildFloorPlanPath("parramatta-city-library", { floorId: "demo-parramatta-ground" })).toBe(
      "/accessibility-map/parramatta-city-library/floor-plan?floor=demo-parramatta-ground",
    );
  });
});
