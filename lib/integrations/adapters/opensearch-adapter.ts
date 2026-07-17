import { isOpenSearchConfigured, openSearchConfig } from "@/lib/config/opensearch";
import type {
  IntegrationAdapter,
  IntegrationHealthResult,
} from "@/lib/integrations/integration-types";
import { openSearchFetch } from "@/lib/search/opensearch-client";

export const openSearchAdapter: IntegrationAdapter = {
  key: "opensearch",
  type: "search",
  displayName: "OpenSearch",

  isEnabled() {
    return isOpenSearchConfigured();
  },

  async healthCheck(): Promise<IntegrationHealthResult> {
    if (!this.isEnabled()) {
      return {
        status: "degraded",
        message: "OpenSearch not enabled — set OPENSEARCH_ENABLED=true and credentials",
      };
    }

    try {
      const res = await openSearchFetch("/_cluster/health", {
        method: "GET",
        signal: AbortSignal.timeout(8_000),
      });

      if (!res.ok) {
        return {
          status: "degraded",
          message: `Cluster health returned ${res.status}`,
        };
      }

      const data = (await res.json()) as { status?: string };
      const clusterStatus = data.status ?? "unknown";

      if (clusterStatus === "red") {
        return { status: "unhealthy", message: "Cluster status red" };
      }

      return {
        status: clusterStatus === "yellow" ? "degraded" : "healthy",
        message: `Cluster status ${clusterStatus} (${openSearchConfig.url})`,
      };
    } catch (err) {
      return {
        status: "degraded",
        message: err instanceof Error ? err.message : "Cluster health check failed",
      };
    }
  },
};
