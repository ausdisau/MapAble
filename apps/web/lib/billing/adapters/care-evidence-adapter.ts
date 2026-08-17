import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import {
  attachEvidence,
  createFromSource,
} from "@/lib/billing/service-records/service";
import { assertProviderOrgAccess } from "@/lib/care/access-control";
import { prisma } from "@/lib/prisma";

/**
 * Transform a participant-confirmed CareServiceLog into a BillingServiceRecord.
 * Idempotent on (sourceType=care_shift, sourceId=log id).
 * Does not auto-approve invoices or submit NDIA claims.
 */
export async function createBillableItemFromCareEvidence(input: {
  careBookingId: string;
  actor: CurrentUser;
}) {
  const booking = await prisma.careBooking.findUnique({
    where: { id: input.careBookingId },
    include: { serviceLogs: true, serviceAgreement: true },
  });
  if (!booking) throw new Error("NOT_FOUND");
  await assertProviderOrgAccess(input.actor, booking.organisationId);

  const agreementAccepted =
    booking.serviceAgreement?.status === "accepted" ||
    (typeof booking.serviceAgreement?.placeholderSummary === "string" &&
      booking.serviceAgreement.placeholderSummary.includes('"status":"accepted"'));
  if (!agreementAccepted) {
    throw new Error("AGREEMENT_REQUIRED");
  }

  const confirmedLog = booking.serviceLogs.find((l) => l.status === "confirmed");
  if (!confirmedLog) {
    throw new Error("SERVICE_LOG_REQUIRED");
  }

  const quantityHours =
    confirmedLog.durationMinutes && confirmedLog.durationMinutes > 0
      ? confirmedLog.durationMinutes / 60
      : 1;

  const record = await createFromSource({
    organisationId: booking.organisationId,
    participantId: booking.participantId,
    sourceType: "care_shift",
    sourceId: confirmedLog.id,
    serviceType: "care",
    serviceStart: confirmedLog.submittedAt ?? confirmedLog.createdAt,
    serviceEnd: confirmedLog.confirmedAt ?? undefined,
    quantity: quantityHours,
    unit: "hour",
    workerOrProviderId: confirmedLog.workerProfileId ?? undefined,
    estimatedCents: 0,
    notesForBilling:
      "Evidence-backed care service record. Pricing unresolved until versioned policy applied. Not a funding approval.",
    actorId: input.actor.id,
    actorRole: input.actor.primaryRole,
  });

  await attachEvidence({
    serviceRecordId: record.id,
    evidenceType: "care_service_log",
    referenceId: confirmedLog.id,
    summary: `Confirmed care service log ${confirmedLog.id}`,
    metadata: {
      careBookingId: booking.id,
      participantConfirmedAt: confirmedLog.confirmedAt?.toISOString() ?? null,
    },
    actorId: input.actor.id,
    actorRole: input.actor.primaryRole,
  });

  const existingLink = await prisma.careInvoiceLink.findFirst({
    where: { careBookingId: booking.id, careServiceLogId: confirmedLog.id },
  });
  const link = existingLink
    ? await prisma.careInvoiceLink.update({
        where: { id: existingLink.id },
        data: {
          externalInvoiceRef: record.id,
          pricingPlaceholder:
            "Handoff to BillingServiceRecord — apply versioned pricing before invoice issue. Not NDIA approval.",
        },
      })
    : await prisma.careInvoiceLink.create({
        data: {
          careBookingId: booking.id,
          organisationId: booking.organisationId,
          careServiceLogId: confirmedLog.id,
          status: "placeholder",
          pricingPlaceholder:
            "Handoff to BillingServiceRecord — apply versioned pricing before invoice issue. Not NDIA approval.",
          externalInvoiceRef: record.id,
        },
      });

  await createAuditEvent({
    actorUserId: input.actor.id,
    action: "care_billing.evidence_handed_off",
    entityType: "BillingServiceRecord",
    entityId: record.id,
    organisationId: booking.organisationId,
    participantId: booking.participantId,
    metadata: { careServiceLogId: confirmedLog.id, careInvoiceLinkId: link.id },
  });

  return { serviceRecord: record, invoiceLink: link };
}
