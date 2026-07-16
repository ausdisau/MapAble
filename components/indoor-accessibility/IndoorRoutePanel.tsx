"use client";

import { useMemo, useState } from "react";

import type { FloorPlanFeature } from "@/lib/floor-plan/schemas";
import type { IndoorRouteGraph, RouteMode } from "@/lib/indoor-accessibility/schemas/core";
import { planIndoorRoute } from "@/lib/indoor-accessibility/routing/route-planner";
import { useIndoorFeatureEnabled } from "@/hooks/useIndoorFeatureFlags";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type IndoorRoutePanelProps = {
  routeGraph?: IndoorRouteGraph;
  features: FloorPlanFeature[];
  onRoutePlanned?: (nodeIds: string[]) => void;
};

const ROUTE_MODES: Array<{ value: RouteMode; label: string }> = [
  { value: "step_free", label: "Step-free" },
  { value: "shortest_verified", label: "Shortest verified" },
  { value: "low_sensory", label: "Low sensory" },
  { value: "avoid_stairs", label: "Avoid stairs" },
  { value: "avoid_lifts", label: "Avoid lifts" },
];

export function IndoorRoutePanel({ routeGraph, features, onRoutePlanned }: IndoorRoutePanelProps) {
  const enabled = useIndoorFeatureEnabled("verifiedIndoorRouting");
  const [mode, setMode] = useState<RouteMode>("step_free");
  const [fromNodeId, setFromNodeId] = useState("");
  const [toNodeId, setToNodeId] = useState("");

  const unavailableEdgeIds = useMemo(() => {
    if (!routeGraph) return new Set<string>();
    const blockedFeatures = new Set(
      features
        .filter(
          (f) =>
            f.operationalStatus === "unavailable" ||
            f.operationalStatus === "temporarily_closed",
        )
        .map((f) => f.id),
    );
    return new Set(
      routeGraph.edges
        .filter((e) => {
          const from = routeGraph.nodes.find((n) => n.id === e.fromNodeId);
          const to = routeGraph.nodes.find((n) => n.id === e.toNodeId);
          return (
            (from?.featureId && blockedFeatures.has(from.featureId)) ||
            (to?.featureId && blockedFeatures.has(to.featureId))
          );
        })
        .map((e) => e.id),
    );
  }, [routeGraph, features]);

  const result = useMemo(() => {
    if (!routeGraph || !fromNodeId || !toNodeId) return null;
    return planIndoorRoute({
      graph: routeGraph,
      fromNodeId,
      toNodeId,
      mode,
      unavailableEdgeIds,
    });
  }, [routeGraph, fromNodeId, toNodeId, mode, unavailableEdgeIds]);

  if (!enabled) return null;

  if (!routeGraph || routeGraph.nodes.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
        No verified indoor route graph is recorded for this floor. Overlay routes may still be
        available in Text view.
      </section>
    );
  }

  const originOptions = routeGraph.nodes.filter(
    (n) => n.type === "entrance" || n.type === "junction" || n.type === "lift",
  );
  const destinationOptions = routeGraph.nodes.filter(
    (n) => n.type === "destination" || n.type === "junction" || n.type === "assistance_point",
  );

  return (
    <section className="rounded-2xl border border-slate-200 p-4" aria-labelledby="route-heading">
      <h3 id="route-heading" className="font-bold text-[#0C1833]">
        Indoor route planner
      </h3>
      <p className="mt-1 text-xs text-slate-600">
        Routes use authored graph data only. Unverified or unavailable segments are excluded or
        penalised.
      </p>

      <div className="mt-3 space-y-3">
        <label className="block text-sm">
          <span className="font-semibold">Route mode</span>
          <select
            className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableCareFocusRing}`}
            value={mode}
            onChange={(e) => setMode(e.target.value as RouteMode)}
          >
            {ROUTE_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-semibold">From</span>
          <select
            className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableCareFocusRing}`}
            value={fromNodeId}
            onChange={(e) => setFromNodeId(e.target.value)}
          >
            <option value="">Select starting point</option>
            {originOptions.map((n) => (
              <option key={n.id} value={n.id}>
                {n.type} ({n.id})
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-semibold">To</span>
          <select
            className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableCareFocusRing}`}
            value={toNodeId}
            onChange={(e) => setToNodeId(e.target.value)}
          >
            <option value="">Select destination</option>
            {destinationOptions.map((n) => (
              <option key={n.id} value={n.id}>
                {n.type} ({n.id})
              </option>
            ))}
          </select>
        </label>
      </div>

      {result ? (
        <div className="mt-4" role="status">
          {result.found ? (
            <>
              <p className="text-sm font-semibold">
                Route found — approximately {result.totalDistanceMetres.toFixed(0)} metres
              </p>
              {result.trustWarning ? (
                <p className="mt-1 text-xs text-amber-800">{result.trustWarning}</p>
              ) : null}
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                {result.steps.map((step) => (
                  <li key={step.nodeId}>{step.instruction}</li>
                ))}
              </ol>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-amber-950">No route found</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                {result.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
