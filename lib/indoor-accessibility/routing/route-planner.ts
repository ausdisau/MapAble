import type {
  IndoorRouteEdge,
  IndoorRouteGraph,
  IndoorRouteNode,
  OperationalStatus,
  RouteMode,
} from "@/lib/indoor-accessibility/schemas/core";

export type RoutePlanRequest = {
  graph: IndoorRouteGraph;
  fromNodeId: string;
  toNodeId: string;
  mode: RouteMode;
  minDoorWidthMm?: number;
  unavailableEdgeIds?: Set<string>;
  restrictedNodeIds?: Set<string>;
};

export type RouteStep = {
  nodeId: string;
  instruction: string;
  floorPlanId: string;
  featureId?: string;
  distanceMetres?: number;
};

export type RoutePlanResult =
  | {
      found: true;
      nodeIds: string[];
      edges: IndoorRouteEdge[];
      steps: RouteStep[];
      totalDistanceMetres: number;
      trustWarning?: string;
    }
  | {
      found: false;
      reasons: string[];
    };

function edgeCost(
  edge: IndoorRouteEdge,
  mode: RouteMode,
  minDoorWidthMm?: number,
): number | null {
  if (edge.restricted) return null;
  if (edge.operationalStatus === "unavailable" || edge.operationalStatus === "temporarily_closed") {
    return null;
  }
  if (mode === "step_free" && edge.stepFree === false) return null;
  if (mode === "avoid_stairs" && edge.stepFree === false) return null;
  if (minDoorWidthMm && edge.minimumWidthMm != null && edge.minimumWidthMm < minDoorWidthMm) {
    return null;
  }
  let cost = edge.distanceMetres ?? 1;
  if (edge.stepFree === "unknown") cost *= 1.5;
  if (edge.trustLevel === "community_reported" || edge.trustLevel === "not_verified") cost *= 1.2;
  return cost;
}

/** Deterministic Dijkstra over verified indoor route graph. */
export function planIndoorRoute(req: RoutePlanRequest): RoutePlanResult {
  const { graph, fromNodeId, toNodeId, mode, minDoorWidthMm, unavailableEdgeIds, restrictedNodeIds } =
    req;

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  if (!nodeMap.has(fromNodeId) || !nodeMap.has(toNodeId)) {
    return { found: false, reasons: ["Origin or destination not found in route graph."] };
  }

  if (restrictedNodeIds?.has(fromNodeId) || restrictedNodeIds?.has(toNodeId)) {
    return { found: false, reasons: ["Route crosses a restricted area."] };
  }

  const adj = new Map<string, Array<{ edge: IndoorRouteEdge; to: string }>>();
  for (const edge of graph.edges) {
    if (unavailableEdgeIds?.has(edge.id)) continue;
    if (!adj.has(edge.fromNodeId)) adj.set(edge.fromNodeId, []);
    adj.get(edge.fromNodeId)!.push({ edge, to: edge.toNodeId });
    if (edge.bidirectional) {
      if (!adj.has(edge.toNodeId)) adj.set(edge.toNodeId, []);
      adj.get(edge.toNodeId)!.push({ edge, to: edge.fromNodeId });
    }
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, { nodeId: string; edge: IndoorRouteEdge } | null>();
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
    if (u === null || best === Infinity) break;
    if (u === toNodeId) break;
    visited.add(u);

    for (const { edge, to } of adj.get(u) ?? []) {
      if (restrictedNodeIds?.has(to)) continue;
      const cost = edgeCost(edge, mode, minDoorWidthMm);
      if (cost === null) continue;
      const alt = dist.get(u)! + cost;
      if (alt < (dist.get(to) ?? Infinity)) {
        dist.set(to, alt);
        prev.set(to, { nodeId: u, edge });
      }
    }
  }

  if ((dist.get(toNodeId) ?? Infinity) === Infinity) {
    const reasons: string[] = [];
    if (mode === "step_free") reasons.push("No verified step-free connection found.");
    if (unavailableEdgeIds && unavailableEdgeIds.size > 0) {
      reasons.push("A required lift or corridor is reported unavailable.");
    }
    if (reasons.length === 0) reasons.push("Route graph incomplete or no path exists.");
    return { found: false, reasons };
  }

  const nodeIds: string[] = [];
  const edges: IndoorRouteEdge[] = [];
  let cur: string | null = toNodeId;
  while (cur) {
    nodeIds.unshift(cur);
    const p = prev.get(cur);
    if (!p) break;
    edges.unshift(p.edge);
    cur = p.nodeId;
  }

  const steps: RouteStep[] = nodeIds.map((nodeId, i) => {
    const node = nodeMap.get(nodeId)!;
    const edge = edges[i - 1];
    return {
      nodeId,
      floorPlanId: node.floorPlanId,
      featureId: node.featureId,
      distanceMetres: edge?.distanceMetres,
      instruction:
        i === 0
          ? `Start at ${node.type.replace(/_/g, " ")}`
          : `Continue to ${node.type.replace(/_/g, " ")}${edge?.distanceMetres ? ` (${edge.distanceMetres} m)` : ""}`,
    };
  });

  const hasUnverified = edges.some(
    (e) => e.trustLevel === "not_verified" || e.stepFree === "unknown",
  );

  return {
    found: true,
    nodeIds,
    edges,
    steps,
    totalDistanceMetres: dist.get(toNodeId)!,
    trustWarning: hasUnverified
      ? "This route includes segments that are not fully verified."
      : undefined,
  };
}

/** Build a route graph from floor plan document features and routes (demo/authoring bridge). */
export function graphFromFloorPlanFeatures(
  floorPlanId: string,
  features: Array<{ id: string; type: string; position: { x: number; y: number } }>,
  routePoints: Array<{ id: string; points: Array<{ x: number; y: number }> }>,
): IndoorRouteGraph {
  const nodes: IndoorRouteNode[] = features
    .filter((f) =>
      ["accessible_entrance", "lift", "accessible_toilet", "reception", "route_destination"].includes(
        f.type,
      ),
    )
    .map((f) => ({
      id: `node-${f.id}`,
      floorPlanId,
      type: (f.type === "accessible_entrance"
        ? "entrance"
        : f.type === "accessible_toilet" || f.type === "route_destination"
          ? "destination"
          : f.type) as IndoorRouteNode["type"],
      position: f.position,
      featureId: f.id,
    }));

  const edges: IndoorRouteEdge[] = [];
  for (const seg of routePoints) {
    for (let i = 0; i < seg.points.length - 1; i++) {
      edges.push({
        id: `edge-${seg.id}-${i}`,
        fromNodeId: `node-${seg.id}-from-${i}`,
        toNodeId: `node-${seg.id}-to-${i}`,
        bidirectional: true,
        stepFree: true,
        trustLevel: "mapable_verified",
        restricted: false,
      });
    }
  }

  return { schemaVersion: 1, nodes, edges };
}
