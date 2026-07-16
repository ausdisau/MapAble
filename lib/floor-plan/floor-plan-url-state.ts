export type FloorPlanUrlState = {
  venueId?: string;
  floorId?: string;
  featureId?: string;
  routeId?: string;
  view?: "plan" | "text";
};

export function parseFloorPlanSearchParams(
  params: URLSearchParams,
): FloorPlanUrlState {
  return {
    venueId: params.get("venue") ?? undefined,
    floorId: params.get("floor") ?? undefined,
    featureId: params.get("feature") ?? undefined,
    routeId: params.get("route") ?? undefined,
    view: params.get("view") === "text" ? "text" : params.get("view") === "plan" ? "plan" : undefined,
  };
}

export function buildFloorPlanSearchParams(state: FloorPlanUrlState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.venueId) params.set("venue", state.venueId);
  if (state.floorId) params.set("floor", state.floorId);
  if (state.featureId) params.set("feature", state.featureId);
  if (state.routeId) params.set("route", state.routeId);
  if (state.view) params.set("view", state.view);
  return params;
}

export function buildFloorPlanPath(slug: string, state?: Partial<FloorPlanUrlState>): string {
  const base = `/accessibility-map/${slug}/floor-plan`;
  if (!state) return base;
  const params = buildFloorPlanSearchParams(state as FloorPlanUrlState);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
