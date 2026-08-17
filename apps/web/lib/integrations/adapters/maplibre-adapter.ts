import type {
  IntegrationAdapter,
  IntegrationHealthResult,
} from "@/lib/integrations/integration-types";
import { getMapStyleUrl } from "@/lib/map/map-style";

export const maplibreAdapter: IntegrationAdapter = {
  key: "maplibre",
  type: "maps",
  displayName: "MapLibre",

  isEnabled() {
    return process.env.MAP_INTEGRATION_ENABLED === "true";
  },

  async healthCheck(): Promise<IntegrationHealthResult> {
    const styleUrl = getMapStyleUrl();
    try {
      const res = await fetch(styleUrl, { method: "HEAD" });
      if (!res.ok) {
        return { status: "degraded", message: `Style URL returned ${res.status}` };
      }
      return { status: "healthy", message: "Map style reachable" };
    } catch (err) {
      return {
        status: "degraded",
        message: err instanceof Error ? err.message : "Style check failed",
      };
    }
  },
};
