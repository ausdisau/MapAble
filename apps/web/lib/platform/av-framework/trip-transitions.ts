import type { TransportTripStatus } from "@prisma/client";

/** Provider/admin trip status transitions (human dispatch required). */
export const AV_TRIP_TRANSITIONS: Partial<
  Record<TransportTripStatus, TransportTripStatus[]>
> = {
  requested: ["provider_review", "accepted", "cancelled"],
  provider_review: ["accepted", "declined", "cancelled"],
  accepted: ["dispatch_pending", "cancelled"],
  dispatch_pending: ["driver_vehicle_assigned", "cancelled"],
  driver_vehicle_assigned: ["driver_accepted", "declined", "cancelled"],
  driver_accepted: ["pre_start_check_required", "driver_no_show", "cancelled"],
  pre_start_check_required: ["en_route_to_pickup", "unsafe_to_continue"],
  en_route_to_pickup: ["arrived_at_pickup", "unsafe_to_continue"],
  arrived_at_pickup: [
    "participant_boarded",
    "participant_no_show",
    "unsafe_to_continue",
  ],
  participant_boarded: ["en_route_to_dropoff", "unsafe_to_continue"],
  en_route_to_dropoff: ["arrived_at_dropoff", "unsafe_to_continue"],
  arrived_at_dropoff: [
    "handover_completed",
    "handover_failed",
    "unsafe_to_continue",
  ],
  handover_completed: ["trip_completed"],
  trip_completed: ["evidence_submitted", "participant_review"],
  evidence_submitted: ["participant_review", "closed"],
  participant_review: ["closed", "disputed"],
  disputed: ["service_recovery_required", "closed"],
  service_recovery_required: ["dispatch_pending", "closed", "cancelled"],
  handover_failed: ["service_recovery_required", "disputed"],
  unsafe_to_continue: ["service_recovery_required", "cancelled"],
  driver_no_show: ["service_recovery_required", "cancelled"],
  participant_no_show: ["cancelled", "service_recovery_required"],
};

/** Driver-operable transitions only. */
export const AV_DRIVER_TRIP_TRANSITIONS: Partial<
  Record<TransportTripStatus, TransportTripStatus[]>
> = {
  driver_accepted: ["pre_start_check_required"],
  pre_start_check_required: ["en_route_to_pickup"],
  en_route_to_pickup: ["arrived_at_pickup"],
  arrived_at_pickup: ["participant_boarded", "participant_no_show"],
  participant_boarded: ["en_route_to_dropoff"],
  en_route_to_dropoff: ["arrived_at_dropoff"],
  arrived_at_dropoff: ["handover_completed", "handover_failed"],
  handover_completed: ["trip_completed"],
  trip_completed: ["evidence_submitted"],
};

export function avTripTransitionAllowed(
  from: TransportTripStatus,
  to: TransportTripStatus,
  options?: { driverOnly?: boolean }
) {
  const map = options?.driverOnly
    ? AV_DRIVER_TRIP_TRANSITIONS
    : AV_TRIP_TRANSITIONS;
  const allowed = map[from] ?? [];
  return allowed.includes(to);
}

export const AV_TERMINAL_TRIP_STATUSES: TransportTripStatus[] = [
  "closed",
  "cancelled",
  "declined",
];
