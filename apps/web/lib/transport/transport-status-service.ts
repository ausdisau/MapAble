import type { TransportTripStatus } from "@prisma/client";

import {
  AV_DRIVER_TRIP_TRANSITIONS,
  AV_TERMINAL_TRIP_STATUSES,
  AV_TRIP_TRANSITIONS,
} from "@/lib/platform/av-framework/trip-transitions";
import { TransportApiError } from "@/lib/transport/transport-api-error";

const TRANSITIONS = AV_TRIP_TRANSITIONS;
const DRIVER_TRANSITIONS = AV_DRIVER_TRIP_TRANSITIONS;

export function assertStatusTransition(
  from: TransportTripStatus,
  to: TransportTripStatus,
  options?: { driverOnly?: boolean }
) {
  const map = options?.driverOnly ? DRIVER_TRANSITIONS : TRANSITIONS;
  const allowed = map[from] ?? [];
  if (!allowed.includes(to)) {
    throw new TransportApiError("TRANSPORT_INVALID_STATUS_TRANSITION", undefined, {
      from,
      to,
    });
  }
}

export function isTerminalStatus(status: TransportTripStatus) {
  return AV_TERMINAL_TRIP_STATUSES.includes(status);
}
