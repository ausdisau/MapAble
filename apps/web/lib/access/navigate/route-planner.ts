import {
  edgeWeight,
  isSegmentBlocked,
  segmentExcludedByPolicy,
  segmentPassesHardConstraints,
} from "./scoring";
import type {
  AccessPathGraph,
  AccessPathSegment,
  MobilityRoutingConstraints,
  PlannedRoutePath,
  RouteObjective,
  RoutePlanResult,
  TemporaryBarrierState,
} from "./types";

const WALKING_SPEED_M_PER_MIN = 60;

type EdgeEntry = { segment: AccessPathSegment; toNodeId: string };

function buildAdjacency(graph: AccessPathGraph): Map<string, EdgeEntry[]> {
  const adj = new Map<string, EdgeEntry[]>();
  for (const segment of graph.segments) {
    if (!adj.has(segment.fromNodeId)) adj.set(segment.fromNodeId, []);
    adj.get(segment.fromNodeId)!.push({
      segment,
      toNodeId: segment.toNodeId,
    });
    if (segment.bidirectional) {
      if (!adj.has(segment.toNodeId)) adj.set(segment.toNodeId, []);
      adj.get(segment.toNodeId)!.push({
        segment: { ...segment, fromNodeId: segment.toNodeId, toNodeId: segment.fromNodeId },
        toNodeId: segment.fromNodeId,
      });
    }
  }
  return adj;
}

function dijkstra(
  graph: AccessPathGraph,
  fromNodeId: string,
  toNodeId: string,
  objective: RouteObjective,
  constraints: MobilityRoutingConstraints,
  barriers: TemporaryBarrierState[],
): PlannedRoutePath | null {
  const adj = buildAdjacency(graph);
  const dist = new Map<string, number>();
  const prev = new Map<string, { nodeId: string; segment: AccessPathSegment } | null>();
  const visited = new Set<string>();

  for (const n of graph.nodes) dist.set(n.id, Infinity);
  dist.set(fromNodeId, 0);
  prev.set(fromNodeId, null);

  while (visited.size < graph.nodes.length) {
    let u: string | null = null;
    let best = Infinity;
    for (const [id, d] of dist) {
      if (!visited.has(id) && d < best) {
        best = d;
        u = id;
      }
    }
    if (u == null || best === Infinity) break;
    if (u === toNodeId) break;
    visited.add(u);

    for (const { segment, toNodeId: v } of adj.get(u) ?? []) {
      if (visited.has(v)) continue;
      if (isSegmentBlocked(segment.id, barriers)) continue;
      if (!segmentPassesHardConstraints(segment, constraints)) continue;
      if (segmentExcludedByPolicy(segment, constraints)) continue;

      const alt = best + edgeWeight(segment, objective, constraints);
      if (alt < (dist.get(v) ?? Infinity)) {
        dist.set(v, alt);
        prev.set(v, { nodeId: u, segment });
      }
    }
  }

  if ((dist.get(toNodeId) ?? Infinity) === Infinity) return null;

  const segmentIds: string[] = [];
  const nodeIds: string[] = [toNodeId];
  let cur: string | null = toNodeId;
  let totalDistance = 0;

  while (cur != null && cur !== fromNodeId) {
    const p = prev.get(cur);
    if (!p) break;
    segmentIds.unshift(p.segment.id);
    totalDistance += p.segment.lengthMetres;
    nodeIds.unshift(p.nodeId);
    cur = p.nodeId;
  }

  if (cur !== fromNodeId) return null;

  return {
    segmentIds,
    nodeIds,
    totalDistanceMetres: totalDistance,
    totalDurationMinutes: Math.max(1, Math.round(totalDistance / WALKING_SPEED_M_PER_MIN)),
  };
}

export function planAccessibleRoutes(input: {
  graph: AccessPathGraph;
  fromNodeId: string;
  toNodeId: string;
  constraints: MobilityRoutingConstraints;
  barriers?: TemporaryBarrierState[];
  objectives?: RouteObjective[];
}): RoutePlanResult {
  const barriers = input.barriers ?? [];
  const objectives: RouteObjective[] =
    input.objectives ?? ["FASTEST", "LOWEST_GRADIENT", "MOST_VERIFIED"];

  const paths: RoutePlanResult["paths"] = [];
  const seenSegmentKeys = new Set<string>();

  for (const objective of objectives) {
    const path = dijkstra(
      input.graph,
      input.fromNodeId,
      input.toNodeId,
      objective,
      input.constraints,
      barriers,
    );
    if (!path) continue;

    const key = path.segmentIds.join(">");
    if (seenSegmentKeys.has(key)) continue;
    seenSegmentKeys.add(key);

    const segments = path.segmentIds
      .map((id) => input.graph.segments.find((s) => s.id === id))
      .filter((s): s is AccessPathSegment => s != null);

    paths.push({ objective, path, segments });
    if (paths.length >= 3) break;
  }

  return { paths };
}
