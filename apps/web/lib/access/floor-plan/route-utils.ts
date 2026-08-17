import type {
  FloorConnector,
  FloorPlanFeature,
  FloorPlanRoute,
} from "@/lib/access/floor-plan/schemas";

/** Check whether a verified route can be shown given feature operational status. */
export function isRouteAvailable(
  route: FloorPlanRoute,
  features: FloorPlanFeature[],
): boolean {
  const featureMap = new Map(features.map((f) => [f.id, f]));
  const from = featureMap.get(route.fromFeatureId);
  const to = featureMap.get(route.toFeatureId);
  if (!from || !to) return false;
  const required = [from, to, ...route.steps.map((s) => (s.featureId ? featureMap.get(s.featureId) : null))].filter(
    Boolean,
  ) as FloorPlanFeature[];
  return required.every(
    (f) =>
      f.operationalStatus !== "unavailable" &&
      f.operationalStatus !== "temporarily_closed",
  );
}

/** Find connector by id across floors. */
export function findConnector(
  connectors: FloorConnector[],
  connectorId: string,
): FloorConnector | undefined {
  return connectors.find((c) => c.id === connectorId);
}

/** Get connected floor plan ids for a connector feature. */
export function getConnectorFloorIds(
  connector: FloorConnector,
): string[] {
  return connector.connectedFloorPlanIds;
}

/** Sort floor plans by sortOrder ascending. */
export function sortFloors<T extends { sortOrder: number }>(plans: T[]): T[] {
  return [...plans].sort((a, b) => a.sortOrder - b.sortOrder);
}
