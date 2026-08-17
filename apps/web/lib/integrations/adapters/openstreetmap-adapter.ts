import {
  isNominatimGeocodingConfigured,
  isOpenStreetMapConfigured,
  openStreetMapConfig,
} from "@/lib/config/openstreetmap";
import type {
  IntegrationAdapter,
  IntegrationHealthResult,
} from "@/lib/integrations/integration-types";

export const openStreetMapAdapter: IntegrationAdapter = {
  key: "openstreetmap",
  type: "maps",
  displayName: "OpenStreetMap",

  isEnabled() {
    return isOpenStreetMapConfigured();
  },

  async healthCheck(): Promise<IntegrationHealthResult> {
    if (!this.isEnabled()) {
      return {
        status: "degraded",
        message: "OpenStreetMap integration disabled via OPENSTREETMAP_ENABLED=false",
      };
    }

    if (!isNominatimGeocodingConfigured()) {
      return {
        status: "healthy",
        message: "Tiles/attribution configured; Nominatim geocoding disabled",
      };
    }

    try {
      const res = await fetch(`${openStreetMapConfig.nominatimBaseUrl}/status`, {
        method: "GET",
        headers: { "User-Agent": openStreetMapConfig.nominatimUserAgent },
        signal: AbortSignal.timeout(8_000),
      });

      if (!res.ok) {
        return {
          status: "degraded",
          message: `Nominatim status returned ${res.status}`,
        };
      }

      return { status: "healthy", message: "Nominatim reachable" };
    } catch (err) {
      return {
        status: "degraded",
        message: err instanceof Error ? err.message : "Nominatim check failed",
      };
    }
  },
};
