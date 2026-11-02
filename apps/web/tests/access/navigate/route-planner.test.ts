import { describe, expect, it } from "vitest";

import {
  edgeWeight,
  segmentPassesHardConstraints,
  isSegmentBlocked,
} from "@/lib/access/navigate/scoring";
import { planAccessibleRoutes } from "@/lib/access/navigate/route-planner";
import { getSandboxGraph } from "@/lib/access/navigate/fixture/sandbox-graph";
import { DEFAULT_MOBILITY_CONSTRAINTS } from "@/lib/access/navigate/types";
import { buildExplanation } from "@/lib/access/navigate/explanation";

describe("Navigate scoring", () => {
  const graph = getSandboxGraph();
  const steep = graph.segments.find((s) => s.id === "s-george-pitt-stairs")!;

  it("excludes stairs when stairsAllowed is false", () => {
    expect(
      segmentPassesHardConstraints(steep, {
        ...DEFAULT_MOBILITY_CONSTRAINTS,
        stairsAllowed: false,
      }),
    ).toBe(false);
  });

  it("blocks segments with active temporary barriers", () => {
    expect(
      isSegmentBlocked("s-central-hay", [
        {
          id: "b1",
          segmentId: "s-central-hay",
          type: "construction",
          reportedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          confidence: 0.5,
          verificationState: "community_reported",
        },
      ]),
    ).toBe(true);
  });

  it("ignores expired barriers", () => {
    expect(
      isSegmentBlocked("s-central-hay", [
        {
          id: "b1",
          segmentId: "s-central-hay",
          type: "construction",
          reportedAt: "2020-01-01T00:00:00Z",
          expiresAt: "2020-01-02T00:00:00Z",
          confidence: 0.5,
          verificationState: "community_reported",
        },
      ]),
    ).toBe(false);
  });

  it("plans at least one route in sandbox graph", () => {
    const result = planAccessibleRoutes({
      graph,
      fromNodeId: "n-central",
      toNodeId: "n-martin",
      constraints: DEFAULT_MOBILITY_CONSTRAINTS,
      objectives: ["FASTEST", "LOWEST_GRADIENT", "MOST_VERIFIED"],
    });
    expect(result.paths.length).toBeGreaterThan(0);
    expect(result.paths[0]!.path.segmentIds.length).toBeGreaterThan(0);
  });

  it("returns route explanation with confidence", () => {
    const result = planAccessibleRoutes({
      graph,
      fromNodeId: "n-central",
      toNodeId: "n-martin",
      constraints: DEFAULT_MOBILITY_CONSTRAINTS,
    });
    const first = result.paths[0]!;
    const explanation = buildExplanation({
      routeId: "test-route",
      objective: first.objective,
      segments: first.segments,
      distanceMetres: first.path.totalDistanceMetres,
      durationMinutes: first.path.totalDurationMinutes,
    });
    expect(explanation.confidence).toBeGreaterThan(0);
    expect(explanation.explanation).toMatch(/segment/i);
  });

  it("penalises ai_inferred segments in MOST_VERIFIED objective", () => {
    const aiSegment = graph.segments.find((s) => s.sourceClass === "ai_inferred")!;
    const verified = graph.segments.find((s) => s.sourceClass === "independently_verified")!;
    const aiCost = edgeWeight(aiSegment, "MOST_VERIFIED", DEFAULT_MOBILITY_CONSTRAINTS);
    const verifiedCost = edgeWeight(verified, "MOST_VERIFIED", DEFAULT_MOBILITY_CONSTRAINTS);
    expect(aiCost).toBeGreaterThan(verifiedCost);
  });
});
