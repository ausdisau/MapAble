import type { TransportTripStatus } from "@prisma/client";

export const TRANSPORT_TRIP_STATUS_LABELS: Record<TransportTripStatus, string> = {
  requested: "Requested",
  provider_review: "Awaiting provider review",
  accepted: "Accepted by provider",
  dispatch_pending: "Awaiting dispatch",
  driver_vehicle_assigned: "Driver and vehicle assigned",
  driver_accepted: "Driver accepted",
  pre_start_check_required: "Pre-start check required",
  en_route_to_pickup: "En route to pickup",
  arrived_at_pickup: "Arrived at pickup",
  participant_boarded: "Participant boarded",
  en_route_to_dropoff: "En route to drop-off",
  arrived_at_dropoff: "Arrived at drop-off",
  handover_completed: "Handover completed",
  trip_completed: "Trip completed",
  evidence_submitted: "Evidence submitted",
  participant_review: "Awaiting your review",
  closed: "Closed",
  cancelled: "Cancelled",
  declined: "Declined by provider",
  driver_no_show: "Driver did not arrive",
  participant_no_show: "Participant did not arrive",
  handover_failed: "Handover failed",
  unsafe_to_continue: "Stopped for safety",
  disputed: "Disputed",
  service_recovery_required: "Service recovery required",
};

export function transportTripStatusLabel(status: TransportTripStatus | string) {
  return (
    TRANSPORT_TRIP_STATUS_LABELS[status as TransportTripStatus] ??
    String(status).replace(/_/g, " ")
  );
}
