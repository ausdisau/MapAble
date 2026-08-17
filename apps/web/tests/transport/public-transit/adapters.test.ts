import { describe, expect, it } from "vitest";

import { mockGtfsAdapter } from "@/lib/transport/public-transit/gtfs-adapter";
import {
  buildTransitSource,
  isSourceFresh,
} from "@/lib/transport/public-transit/types";

describe("public transit adapters", () => {
  it("returns route accessibility with evidence source", async () => {
    const route = await mockGtfsAdapter.getRouteAccessibility("bus-400");
    expect(route).not.toBeNull();
    expect(route?.wheelchairAccessible).toBe("full");
    expect(route?.evidenceSource).toContain("GTFS");
  });

  it("includes lift outage disruptions with non-live fallback flag", async () => {
    const disruptions = await mockGtfsAdapter.getDisruptions();
    const lift = disruptions.find((d) => d.liftOutage);
    expect(lift).toBeDefined();
    expect(lift?.nonLiveAlternativeAvailable).toBe(true);
  });

  it("marks stale sources correctly", () => {
    const stale = buildTransitSource("test", "Stale feed", true);
    stale.fetchedAt = new Date(Date.now() - 60 * 60 * 1000);
    expect(isSourceFresh(stale, 15)).toBe(false);
  });

  it("returns accessible route details as advisory", async () => {
    const details = await mockGtfsAdapter.getAccessibleRouteDetails(
      { lat: -33.87, lng: 151.21 },
      { lat: -33.88, lng: 151.22 }
    );
    expect(details?.advisoryOnly).toBe(true);
    expect(details?.segments.length).toBeGreaterThan(0);
  });
});
