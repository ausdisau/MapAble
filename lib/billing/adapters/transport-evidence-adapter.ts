import {
  OrganisationAccessError,
  assertOrganisationAccess,
} from "@/lib/api/phase3-scope";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import {
  attachEvidence,
  createFromSource,
} from "@/lib/billing/service-records/service";
import { prisma } from "@/lib/prisma";

/**
 * Transform a completed TransportTrip into a BillingServiceRecord.
 * Idempotent on (sourceType=transport_trip, sourceId=trip id).
 * Participant dispute / billing hold is out of scope for auto-invoice.
 */
export async function createBillableItemFromTransportEvidence(input: {
  tripId: string;
  actor: CurrentUser;
}) {
  const trip = await prisma.transportTrip.findUnique({
    where: { id: input.tripId },
  });
  if (!trip) throw new Error("NOT_FOUND");

  const orgId = trip.providerOrganisationId;
  if (!orgId) throw new Error("ORG_REQUIRED");

  if (!isAdminRole(input.actor.primaryRole)) {
    try {
      await assertOrganisationAccess(input.actor, orgId, "transport:manage:org");
    } catch (e) {
      if (e instanceof OrganisationAccessError) throw new Error("FORBIDDEN");
      throw e;
    }
  }

  const status = String(trip.status);
  if (
    ![
      "trip_completed",
      "evidence_submitted",
      "participant_review",
      "closed",
    ].includes(status)
  ) {
    throw new Error("TRIP_NOT_COMPLETE");
  }

  const participantId = trip.participantId;

  const record = await createFromSource({
    organisationId: orgId,
    participantId,
    sourceType: "transport_trip",
    sourceId: trip.id,
    serviceType: "transport",
    serviceStart: trip.scheduledStart,
    serviceEnd: trip.scheduledEnd ?? trip.updatedAt,
    quantity: 1,
    unit: "trip",
    estimatedCents: 0,
    notesForBilling:
      "Evidence-backed transport trip record. Quote acceptance and versioned pricing required before invoice issue. Not a funding approval.",
    actorId: input.actor.id,
    actorRole: input.actor.primaryRole,
  });

  await attachEvidence({
    serviceRecordId: record.id,
    evidenceType: "transport_trip",
    referenceId: trip.id,
    summary: `Transport trip ${trip.id} status=${trip.status}`,
    metadata: {
      legacyTransportBookingId: trip.legacyTransportBookingId ?? null,
      advisoryRoutingOnly: true,
    },
    actorId: input.actor.id,
    actorRole: input.actor.primaryRole,
  });

  await createAuditEvent({
    actorUserId: input.actor.id,
    action: "transport_billing.evidence_handed_off",
    entityType: "BillingServiceRecord",
    entityId: record.id,
    organisationId: orgId,
    participantId,
    metadata: { tripId: trip.id },
  });

  return { serviceRecord: record };
}
