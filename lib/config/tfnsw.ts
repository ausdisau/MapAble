/**
 * TfNSW Open Data / Live Traffic NSW configuration.
 * API key: register at https://opendata.transport.nsw.gov.au/
 * Header format: Authorization: apikey {YOUR_KEY}
 */
function envApiKey(): string | undefined {
  return process.env.TFNSW_API_KEY ?? process.env.TRANSPORT_NSW_API_KEY;
}

export const tfnswConfig = {
  get apiKey() {
    return envApiKey();
  },
  get baseUrl() {
    return (
      process.env.TFNSW_API_BASE_URL?.replace(/\/$/, "") ??
      "https://api.transport.nsw.gov.au"
    );
  },
  get liveTrafficEnabled() {
    return process.env.TFNSW_LIVE_TRAFFIC_ENABLED === "true";
  },
  get tripPlannerEnabled() {
    return process.env.TFNSW_TRIP_PLANNER_ENABLED === "true";
  },
  get cacheTtlSeconds() {
    return Number(process.env.TFNSW_CACHE_TTL_SECONDS ?? "120");
  },
  get enrichRouteEstimates() {
    return process.env.TFNSW_ENRICH_ROUTE_ESTIMATES === "true";
  },
};

export function isTfnswConfigured(): boolean {
  return Boolean(envApiKey()?.trim());
}

export function isTfnswLiveTrafficAvailable(): boolean {
  return tfnswConfig.liveTrafficEnabled && isTfnswConfigured();
}

export function isTfnswTripPlannerAvailable(): boolean {
  return tfnswConfig.tripPlannerEnabled && isTfnswConfigured();
}
