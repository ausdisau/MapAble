import type { TransportRoutingProvider } from "@prisma/client";

export const transportRoutingConfig = {
  provider: (process.env.TRANSPORT_ROUTING_PROVIDER ??
    "mock") as TransportRoutingProvider,
  osrmBaseUrl: process.env.OSRM_BASE_URL ?? "http://router.project-osrm.org",
  graphhopperApiKey: process.env.GRAPHHOPPER_API_KEY,
  openRouteServiceApiKey: process.env.OPENROUTESERVICE_API_KEY,
  routingEnabled: process.env.TRANSPORT_ROUTING_ENABLED === "true",
};
