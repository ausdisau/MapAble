import type { CurrentUser } from "@/lib/auth/current-user";
import { createBillableItemFromCareEvidence } from "@/lib/billing/adapters/care-evidence-adapter";
import { createBillableItemFromTransportEvidence } from "@/lib/billing/adapters/transport-evidence-adapter";

/**
 * Cross-domain care → billing handoff. Routes must stay thin;
 * adapters own evidence transforms (no inline billing mutations in care APIs).
 */
export async function handoffCareBookingToBilling(input: {
  careBookingId: string;
  actor: CurrentUser;
}) {
  return createBillableItemFromCareEvidence({
    careBookingId: input.careBookingId,
    actor: input.actor,
  });
}

/**
 * Cross-domain transport → billing handoff.
 */
export async function handoffTransportTripToBilling(input: {
  tripId: string;
  actor: CurrentUser;
}) {
  return createBillableItemFromTransportEvidence({
    tripId: input.tripId,
    actor: input.actor,
  });
}
