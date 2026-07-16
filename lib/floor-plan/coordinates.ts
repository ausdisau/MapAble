import type { NormalizedPoint } from "@/lib/floor-plan/normalized-point";

/** Convert normalized 0–1 coordinates to CSS percentage strings. */
export function normalizedToPercent(point: NormalizedPoint): { left: string; top: string } {
  return {
    left: `${(point.x * 100).toFixed(4)}%`,
    top: `${(point.y * 100).toFixed(4)}%`,
  };
}

/** Validate normalized point is within bounds. */
export function isValidNormalizedPoint(point: { x: number; y: number }): boolean {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= 0 &&
    point.x <= 1 &&
    point.y >= 0 &&
    point.y <= 1
  );
}

/** Convert normalized polygon to SVG points attribute string (viewBox 0 0 100 100). */
export function polygonToSvgPoints(polygon: NormalizedPoint[]): string {
  return polygon.map((p) => `${p.x * 100},${p.y * 100}`).join(" ");
}

/** Convert normalized route points to SVG polyline points. */
export function routeToSvgPoints(points: NormalizedPoint[]): string {
  return polygonToSvgPoints(points);
}
