import { transportRoutingConfig } from "@/lib/config/transport-routing";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { mockRoutingAdapter } from "@/lib/transport-routing/mock-routing-adapter";
import type { RoutingAdapter } from "@/lib/transport-routing/routing-adapter";
import type {
  RouteEstimateInput,
  RouteMatrixInput,
  RouteOptimisationInput,
} from "@/types/transport-routing";

export class GraphhopperRoutingAdapter implements RoutingAdapter {
  readonly provider = "graphhopper" as const;

  private ensureConfigured() {
    if (!transportRoutingConfig.graphhopperApiKey) {
      throw new TransportApiError("TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE");
    }
  }

  async estimateRoute(input: RouteEstimateInput) {
    this.ensureConfigured();
    return mockRoutingAdapter.estimateRoute(input);
  }

  async routeMatrix(input: RouteMatrixInput) {
    this.ensureConfigured();
    return mockRoutingAdapter.routeMatrix(input);
  }

  async optimise(input: RouteOptimisationInput) {
    this.ensureConfigured();
    const suggestions = await mockRoutingAdapter.optimise(input);
    return suggestions.map((s) => ({
      ...s,
      summary: `${s.summary} (GraphHopper placeholder)`,
    }));
  }

  async healthCheck() {
    return Boolean(transportRoutingConfig.graphhopperApiKey);
  }
}

export const graphhopperRoutingAdapter = new GraphhopperRoutingAdapter();
