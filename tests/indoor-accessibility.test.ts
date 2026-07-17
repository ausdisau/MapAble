import { describe, expect, it } from "vitest";

import { getDemoFloorPlanDetail } from "@/lib/demo/floor-plan-fixture";
import {
  signCheckpointToken,
  verifyCheckpointToken,
} from "@/lib/indoor-accessibility/checkpoints/checkpoint-validator";
import { getIndoorFeatureFlags } from "@/lib/indoor-accessibility/feature-flags";
import { evaluateIndoorFit } from "@/lib/indoor-accessibility/fit/indoor-fit-engine";
import { DEFAULT_INDOOR_PREFERENCES } from "@/lib/indoor-accessibility/fit/types";
import { assertPublicationTransition } from "@/lib/indoor-accessibility/publication/state-machine";
import { planIndoorRoute } from "@/lib/indoor-accessibility/routing/route-planner";
import { resolveFeatureOperationalStatus } from "@/lib/indoor-accessibility/status/incident-resolver";

describe("indoor feature flags", () => {
  it("returns typed flag map", () => {
    const flags = getIndoorFeatureFlags();
    expect(typeof flags.personalAccessibilityFit).toBe("boolean");
    expect(typeof flags.partnerApi).toBe("boolean");
  });
});

describe("publication state machine", () => {
  it("allows draft to in_review", () => {
    expect(() => assertPublicationTransition("draft", "in_review")).not.toThrow();
  });

  it("rejects publish from draft", () => {
    expect(() => assertPublicationTransition("draft", "published")).toThrow();
  });
});

describe("indoor fit engine", () => {
  it("reports missing entrance when step-free required", () => {
    const detail = getDemoFloorPlanDetail("demo-parramatta-library", "demo-parramatta-level1")!;
    const features = detail.plan.features.filter((f) => f.type !== "accessible_entrance");
    const result = evaluateIndoorFit(
      { ...DEFAULT_INDOOR_PREFERENCES, stepFreeRequired: true },
      features,
    );
    expect(result.result).toMatch(/incomplete|barrier|confirmation/);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("detects narrow doorway barrier", () => {
    const detail = getDemoFloorPlanDetail("demo-parramatta-library", "demo-parramatta-ground")!;
    const features = detail.plan.features.map((f) =>
      f.id === "feat-south-entrance"
        ? { ...f, measurements: { ...f.measurements, doorWidthMm: 750 } }
        : f,
    );
    const result = evaluateIndoorFit(
      { ...DEFAULT_INDOOR_PREFERENCES, stepFreeRequired: true, powerchairUser: true },
      features,
    );
    expect(result.result).toBe("known_barrier");
  });
});

describe("indoor route planner", () => {
  it("finds step-free route on demo graph", () => {
    const detail = getDemoFloorPlanDetail("demo-parramatta-library", "demo-parramatta-ground")!;
    const graph = detail.plan.routeGraph;
    expect(graph).toBeDefined();

    const result = planIndoorRoute({
      graph: graph!,
      fromNodeId: "node-entrance",
      toNodeId: "node-toilet",
      mode: "step_free",
    });
    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.steps.length).toBeGreaterThan(0);
    }
  });

  it("explains when lift edge unavailable", () => {
    const detail = getDemoFloorPlanDetail("demo-parramatta-library", "demo-parramatta-ground")!;
    const graph = detail.plan.routeGraph!;

    const result = planIndoorRoute({
      graph,
      fromNodeId: "node-entrance",
      toNodeId: "node-toilet",
      mode: "step_free",
      unavailableEdgeIds: new Set(["edge-lift-toilet"]),
    });
    expect(result.found).toBe(false);
    if (!result.found) {
      expect(result.reasons.length).toBeGreaterThan(0);
    }
  });
});

describe("incident resolver", () => {
  it("prefers verified closure over community report", () => {
    const resolved = resolveFeatureOperationalStatus("available", [
      {
        trustLevel: "community_reported",
        operationalStatus: "unavailable",
        reportedAt: new Date().toISOString(),
      },
      {
        trustLevel: "mapable_verified",
        operationalStatus: "unavailable",
        reportedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
      },
    ]);
    expect(resolved.source).toBe("mapable_verified");
  });
});

describe("checkpoint tokens", () => {
  it("round-trips signed tokens", () => {
    const token = signCheckpointToken({
      checkpointId: "cp-1",
      venueId: "venue-1",
      floorPlanId: "fp-1",
      tokenVersion: 1,
    });
    const payload = verifyCheckpointToken(token);
    expect(payload?.checkpointId).toBe("cp-1");
  });
});
