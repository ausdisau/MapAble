import type { TransportRoutingProvider } from "@prisma/client";

import type {
  RouteEstimateInput,
  RouteEstimateResult,
  RouteMatrixInput,
  RouteMatrixResult,
  RouteOptimisationInput,
  RouteOptimisationSuggestion,
} from "@/types/transport-routing";

export interface RoutingAdapter {
  readonly provider: TransportRoutingProvider;
  estimateRoute(input: RouteEstimateInput): Promise<RouteEstimateResult>;
  routeMatrix(input: RouteMatrixInput): Promise<RouteMatrixResult>;
  optimise(input: RouteOptimisationInput): Promise<RouteOptimisationSuggestion[]>;
  healthCheck(): Promise<boolean>;
}
