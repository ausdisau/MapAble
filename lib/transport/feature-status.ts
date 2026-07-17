/**
 * Local typed transport feature status for the public module page and shells.
 * Replaced later by server capability configuration (Prompt PC-0).
 */

export type TransportFeatureAvailability =
  | "available_now"
  | "pilot_sandbox"
  | "coming_next"
  | "requires_partner";

export type TransportFeatureStatusItem = {
  id: string;
  title: string;
  summary: string;
  status: TransportFeatureAvailability;
  /** When true, must not be labelled Available now until a production claim gate passes. */
  productionClaimKey?:
    | "driver_vehicle_verification"
    | "trip_status_evidence_review"
    | "routing_adapters";
};

export const TRANSPORT_FEATURE_STATUS_LABELS: Record<
  TransportFeatureAvailability,
  string
> = {
  available_now: "Available now",
  pilot_sandbox: "Pilot or sandbox",
  coming_next: "Coming next",
  requires_partner: "Requires partner integration",
};

/**
 * Honest default matrix for the current repository pilot.
 * Do not mark verification, live status, evidence, or partner dispatch as available_now.
 */
export const TRANSPORT_FEATURE_STATUS: TransportFeatureStatusItem[] = [
  {
    id: "public-landing",
    title: "Public transport module overview",
    summary:
      "Plain-language explanation of the safety model, privacy boundaries, and entry points.",
    status: "available_now",
  },
  {
    id: "provider-finder",
    title: "Provider finder for transport-related search",
    summary:
      "Search and discover transport-related providers from the public directory.",
    status: "available_now",
  },
  {
    id: "signed-in-request",
    title: "Signed-in trip request and trip history",
    summary:
      "Authenticated participants can create a trip request and view their trip list in the pilot.",
    status: "pilot_sandbox",
  },
  {
    id: "advisory-routing",
    title: "Advisory route estimates",
    summary:
      "Distance and duration estimates are advisory. Mock or partner adapters must be labelled; missing keys stay unavailable.",
    status: "pilot_sandbox",
    productionClaimKey: "routing_adapters",
  },
  {
    id: "driver-vehicle-verification",
    title: "Driver and vehicle eligibility before dispatch",
    summary:
      "Server-enforced verification and access-fit checks before assignment are not a public production claim yet.",
    status: "coming_next",
    productionClaimKey: "driver_vehicle_verification",
  },
  {
    id: "trip-status-evidence",
    title: "Trip status updates, evidence, and participant review",
    summary:
      "Canonical live status, service evidence, and completion review remain coming next until release gates pass.",
    status: "coming_next",
    productionClaimKey: "trip_status_evidence_review",
  },
  {
    id: "partner-dispatch",
    title: "Partner operator booking and dispatch APIs",
    summary:
      "External operator booking integrations require a participating transport partner and configured credentials.",
    status: "requires_partner",
  },
  {
    id: "station-assistance",
    title: "Public-transit station assistance",
    summary:
      "Staff meeting or station assistance claims require an authenticated partner assistance integration.",
    status: "requires_partner",
  },
];

export function transportFeaturesByStatus(
  status: TransportFeatureAvailability
): TransportFeatureStatusItem[] {
  return TRANSPORT_FEATURE_STATUS.filter((item) => item.status === status);
}

export function transportFeatureSummaries(
  status: TransportFeatureAvailability
): string[] {
  return transportFeaturesByStatus(status).map(
    (item) => `${item.title}: ${item.summary}`
  );
}
