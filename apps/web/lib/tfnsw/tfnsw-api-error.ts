import { TransportApiError } from "@/lib/transport/transport-api-error";

export function tfnswNotConfiguredError() {
  return new TransportApiError(
    "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
    "TfNSW traffic data is not configured. Set TFNSW_API_KEY on the server."
  );
}

export function tfnswUpstreamError(status: number, detail?: string) {
  return new TransportApiError(
    "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
    detail ?? `TfNSW API returned status ${status}. Please try again later.`,
    { upstreamStatus: status }
  );
}
