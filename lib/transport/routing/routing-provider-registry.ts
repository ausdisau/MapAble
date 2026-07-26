import type { TransportRoutingProvider } from "@prisma/client";

import { transportRoutingConfig } from "@/lib/config/transport-routing";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { graphhopperRoutingAdapter } from "@/lib/transport/routing/graphhopper-routing-adapter";
import { mockRoutingAdapter } from "@/lib/transport/routing/mock-routing-adapter";
import { openRouteServiceRoutingAdapter } from "@/lib/transport/routing/openrouteservice-routing-adapter";
import { osrmRoutingAdapter } from "@/lib/transport/routing/osrm-routing-adapter";
import type { RoutingAdapter } from "@/lib/transport/routing/routing-adapter";

const ADAPTERS: Record<TransportRoutingProvider, RoutingAdapter> = {
  mock: mockRoutingAdapter,
  osrm: osrmRoutingAdapter,
  graphhopper: graphhopperRoutingAdapter,
  openrouteservice: openRouteServiceRoutingAdapter,
  disabled: mockRoutingAdapter,
};

export function getRoutingAdapter(
  provider?: TransportRoutingProvider
): RoutingAdapter {
  const key = provider ?? transportRoutingConfig.provider;
  const adapter = ADAPTERS[key];
  if (!adapter) {
    throw new TransportApiError("TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE");
  }
  if (key === "disabled" && process.env.NODE_ENV === "production") {
    throw new TransportApiError("TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE");
  }
  return adapter;
}
