import type { DemoAccessPlace } from "@/lib/demo/accessibility-places";
import type { CachedVenueSpec } from "@/lib/offline/venue-search-cache";

/** Map demo places to a minimised public DTO safe for offline/API cache. */
export function toPublicVenueSpec(place: DemoAccessPlace): CachedVenueSpec {
  return {
    id: place.id,
    slug: place.slug,
    name: place.name,
    category: place.category,
    suburb: place.suburb,
    state: place.state,
    accessScore: place.accessScore,
    tier: place.tier,
    confidence: place.confidence,
    lastChecked: place.lastChecked,
    source: place.source,
    topAccessFacts: place.topAccessFacts,
    keyBarrier: place.keyBarrier,
    measurements: place.measurements,
    doorWidthMm: place.profile.doorWidthMm,
    stepFreeEntry: place.profile.stepFreeEntry,
    accessibleToilet: place.profile.accessibleToilet,
  };
}
