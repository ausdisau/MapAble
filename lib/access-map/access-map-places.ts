import { loadMapableAdlAccessPlaces } from "@/lib/access-map/mapable-adl-dataset";
import {
  DEMO_ACCESS_PLACES,
  type DemoAccessPlace,
} from "@/lib/demo/accessibility-places";

/**
 * All places shown on Access Map: curated demos first, then MapAble ADL KML import.
 */
export async function getAccessMapPlaces(): Promise<DemoAccessPlace[]> {
  const adlPlaces = await loadMapableAdlAccessPlaces();
  if (adlPlaces.length === 0) return DEMO_ACCESS_PLACES;
  return [...DEMO_ACCESS_PLACES, ...adlPlaces];
}

export async function getAccessMapPlaceBySlug(
  slug: string
): Promise<DemoAccessPlace | undefined> {
  const demo = DEMO_ACCESS_PLACES.find((place) => place.slug === slug);
  if (demo) return demo;
  const adlPlaces = await loadMapableAdlAccessPlaces();
  return adlPlaces.find((place) => place.slug === slug);
}
