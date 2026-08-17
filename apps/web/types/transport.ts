import type { TransportTripStatus } from "@prisma/client";

export type { TransportTripStatus };

export const TRANSPORT_TRIP_STATUSES = [
  "requested",
  "provider_review",
  "accepted",
  "dispatch_pending",
  "driver_vehicle_assigned",
  "driver_accepted",
  "pre_start_check_required",
  "en_route_to_pickup",
  "arrived_at_pickup",
  "participant_boarded",
  "en_route_to_dropoff",
  "arrived_at_dropoff",
  "handover_completed",
  "trip_completed",
  "evidence_submitted",
  "participant_review",
  "closed",
  "cancelled",
  "declined",
  "driver_no_show",
  "participant_no_show",
  "handover_failed",
  "unsafe_to_continue",
  "disputed",
  "service_recovery_required",
] as const satisfies readonly TransportTripStatus[];

export type TransportAddressView = {
  suburb: string | null;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  accessNotes?: string | null;
};

export type TransportTripPermissions = {
  canViewExactPickup: boolean;
  canViewExactDropoff: boolean;
  canCancel: boolean;
  canConfirm: boolean;
  canDispute: boolean;
  canAccept: boolean;
  canDecline: boolean;
  canAssign: boolean;
  canUnassign: boolean;
  canUpdateStatus: boolean;
  canSubmitLocation: boolean;
  canSubmitEvidence: boolean;
  canReportIssue: boolean;
  canRequestServiceRecovery: boolean;
};

export type TransportNextAction = {
  action: string;
  label: string;
  method?: "GET" | "POST" | "PATCH";
  href?: string;
};

export type TransportTripListItem = {
  id: string;
  status: TransportTripStatus;
  scheduledStart: string;
  scheduledEnd: string | null;
  pickup: TransportAddressView;
  dropoff: TransportAddressView;
  providerOrganisationId: string | null;
};

export type TransportTripDetail = TransportTripListItem & {
  participantId: string;
  mobilityRequirements: Record<string, unknown>;
  disputeReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TransportHandoverStatusView = {
  preStartComplete: boolean;
  pickupHandoverComplete: boolean;
  dropoffHandoverComplete: boolean;
};

export type TransportTripApiResponse = {
  trip: TransportTripDetail;
  permissions: TransportTripPermissions;
  nextActions: TransportNextAction[];
  routeEstimate?: {
    distanceMetres: number;
    durationSeconds: number;
    advisoryDisclaimer: string;
    provider: string;
  };
  suitabilityWarnings?: string[];
  handoverStatus?: TransportHandoverStatusView;
  trafficAdvisory?: import("@/types/tfnsw").TrafficAdvisory;
  assignedVehicle?: { id: string; displayName: string };
  linkedBookingId?: string;
};

export type TransportErrorCode =
  | "TRANSPORT_TRIP_NOT_FOUND"
  | "TRANSPORT_ACCESS_DENIED"
  | "TRANSPORT_CONSENT_REQUIRED"
  | "TRANSPORT_INVALID_STATUS_TRANSITION"
  | "TRANSPORT_DRIVER_NOT_ELIGIBLE"
  | "TRANSPORT_VEHICLE_NOT_ELIGIBLE"
  | "TRANSPORT_SCHEDULE_CONFLICT"
  | "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE"
  | "TRANSPORT_ROUTE_NOT_FOUND"
  | "TRANSPORT_OPTIMISATION_FAILED"
  | "TRANSPORT_VALIDATION_FAILED"
  | "TRANSPORT_COMMAND_DISABLED"
  | "TRANSPORT_CONTINUITY_DISABLED"
  | "TRANSPORT_AUTO_SUBSTITUTION_FORBIDDEN"
  | "TRANSPORT_PARTICIPANT_MISMATCH"
  | "TRANSPORT_RETURN_ASSURANCE_NOT_FOUND"
  | "TRANSPORT_RECOVERY_NOT_FOUND"
  | "TRANSPORT_RECOVERY_ALREADY_CONFIRMED"
  | "TRANSPORT_RECOVERY_EXPIRED"
  | "TRANSPORT_RECOVERY_OPTION_NOT_FOUND";
