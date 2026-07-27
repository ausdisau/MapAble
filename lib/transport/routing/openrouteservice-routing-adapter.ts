import { transportRoutingConfig } from "@/lib/config/transport-routing";
import { mockRoutingAdapter } from "@/lib/transport/routing/mock-routing-adapter";
import type { RoutingAdapter } from "@/lib/transport/routing/routing-adapter";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import type {
  RouteEstimateInput,
  RouteMatrixInput,
  RouteOptimisationInput,
} from "@/types/transport-routing";

export class OpenRouteServiceRoutingAdapter implements RoutingAdapter {
  readonly provider = "openrouteservice" as const;

  private ensureConfigured() {
    if (!transportRoutingConfig.openRouteServiceApiKey) {
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
    return mockRoutingAdapter.optimise(input);
  }

  async healthCheck() {
    return Boolean(transportRoutingConfig.openRouteServiceApiKey);
  }
}

export const openRouteServiceRoutingAdapter =
  new OpenRouteServiceRoutingAdapter();
