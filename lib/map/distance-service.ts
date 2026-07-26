import { distanceKm } from "@/lib/map/geo";

/** Re-export haversine helper; prefer importing from `@/lib/map/geo` directly. */
export { distanceKm };

export function sortByDistance<T extends { distanceKm?: number | null }>(
  items: T[]
): T[] {
  return [...items].sort(
    (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
  );
}
