import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearTfnswClientCache } from "@/lib/tfnsw/client";
import { buildTrafficAdvisoryForRoute } from "@/lib/tfnsw/traffic-advisory-service";
import type { LiveTrafficFeatureCollection } from "@/types/tfnsw";

const sampleHazards: LiveTrafficFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [151.21, -33.87] },
      properties: { id: "h1", headline: "Crash", category: "incident" },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [150.0, -34.5] },
      properties: { id: "h2", headline: "Far away" },
    },
  ],
};

describe("TfNSW traffic advisory", () => {
  beforeEach(() => {
    vi.stubEnv("TFNSW_API_KEY", "test-key");
    vi.stubEnv("TFNSW_LIVE_TRAFFIC_ENABLED", "true");
    vi.stubEnv("TFNSW_ENRICH_ROUTE_ESTIMATES", "true");
    clearTfnswClientCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    clearTfnswClientCache();
  });

  it("filters hazards to route corridor when upstream returns GeoJSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => sampleHazards,
      })
    );

    const advisory = await buildTrafficAdvisoryForRoute({
      origin: { lat: -33.8688, lng: 151.2093 },
      destination: { lat: -33.88, lng: 151.22 },
      force: true,
    });

    expect(advisory).not.toBeNull();
    expect(advisory!.hazardCount).toBe(1);
    expect(advisory!.hazards[0]?.headline).toBe("Crash");
    expect(advisory!.source).toBe("tfnsw_live_traffic");
  });

  it("returns null when enrich flag is off and force is false", async () => {
    vi.stubEnv("TFNSW_ENRICH_ROUTE_ESTIMATES", "false");

    const advisory = await buildTrafficAdvisoryForRoute({
      origin: { lat: -33.87, lng: 151.21 },
      destination: { lat: -33.88, lng: 151.22 },
    });

    expect(advisory).toBeNull();
  });
});

describe("TfNSW client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    clearTfnswClientCache();
  });

  it("throws when API key is missing", async () => {
    vi.stubEnv("TFNSW_API_KEY", "");
    const { tfnswGetJson } = await import("@/lib/tfnsw/client");
    await expect(
      tfnswGetJson({ path: "/v1/live/status" })
    ).rejects.toMatchObject({
      code: "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
    });
  });
});
