"use client";

import { polygonToSvgPoints, routeToSvgPoints } from "@/lib/access/floor-plan/coordinates";
import type { FloorPlanRoute, FloorPlanZone } from "@/lib/access/floor-plan/schemas";

type FloorPlanRouteLayerProps = {
  zones: FloorPlanZone[];
  routes: FloorPlanRoute[];
  activeRouteId?: string;
  floorPlanId: string;
};

export function FloorPlanRouteLayer({
  zones,
  routes,
  activeRouteId,
  floorPlanId,
}: FloorPlanRouteLayerProps) {
  const floorRoutes = routes.filter((r) =>
    r.floorSegments.some((s) => s.floorPlanId === floorPlanId),
  );

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {zones.map((zone) => (
        <polygon
          key={zone.id}
          points={polygonToSvgPoints(zone.polygon)}
          className="fp-zone"
          fill="rgba(0, 169, 121, 0.12)"
          stroke="rgba(0, 91, 127, 0.5)"
          strokeWidth="0.3"
        />
      ))}
      {floorRoutes.map((route) => {
        const segment = route.floorSegments.find((s) => s.floorPlanId === floorPlanId);
        if (!segment) return null;
        const active = activeRouteId === route.id;
        return (
          <polyline
            key={route.id}
            points={routeToSvgPoints(segment.points)}
            className={active ? "fp-route fp-route--active" : "fp-route"}
            fill="none"
            stroke={active ? "#005B7F" : "#00A979"}
            strokeWidth={active ? "1.2" : "0.8"}
            strokeDasharray={active ? undefined : "2 1"}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}
