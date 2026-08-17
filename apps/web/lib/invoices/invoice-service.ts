import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { runBillingPreflight } from "@/lib/billing/preflight";
import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import { phase2Config } from "@/lib/config/phase2";
import { prisma } from "@/lib/prisma";

export async function createInvoiceDraftFromBooking(
  bookingId: string,
  createdById: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { assignedOrganisation: true },
  });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");

  const invoice = await prisma.invoice.create({
    data: {
      participantId: booking.participantId,
      organisationId: booking.assignedOrganisationId,
      bookingId: booking.id,
      fundingSourceId: booking.fundingSourceId,
      status: "draft",
      currency: phase2Config.billingDefaultCurrency,
      createdById,
      lines: {
        create: [
          {
            description: `Support service — ${booking.bookingType.replace("_", " ")}`,
            serviceDate: booking.requestedStart,
            quantity: 1,
            unitAmountCents: 0,
            totalAmountCents: 0,
            claimableByNdis: false,
          },
        ],
      },
    },
    include: { lines: true },
  });

  await createAuditEvent({
    actorUserId: createdById,
    action: "invoice.created",
    entityType: "Invoice",
    entityId: invoice.id,
    participantId: booking.participantId,
  });

  await recordBookingTimelineEvent({
    bookingId,
    eventType: "invoice_drafted",
    title: "Invoice draft created",
    actorUserId: createdById,
    isAdminOnly: true,
  });

  return invoice;
}

export async function runAndStorePreflight(
  invoiceId: string,
  createdById: string
) {
  const outcome = await runBillingPreflight(invoiceId);

  const result = await prisma.billingPreflightResult.create({
    data: {
      invoiceId,
      status: outcome.status,
      checks: outcome.checks,
      failedReasons: outcome.failedReasons,
      createdById,
    },
  });

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status:
        outcome.status === "passed"
          ? "approved_for_invoicing"
          : "preflight_failed",
    },
  });

  await createAuditEvent({
    actorUserId: createdById,
    action: "invoice.preflight",
    entityType: "Invoice",
    entityId: invoiceId,
    metadata: { status: outcome.status },
  });

  return { result, outcome };
}

export async function voidInvoice(invoiceId: string, actorUserId: string) {
  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "voided" },
  });
  await createAuditEvent({
    actorUserId,
    action: "invoice.voided",
    entityType: "Invoice",
    entityId: invoiceId,
    participantId: invoice.participantId,
  });
  return invoice;
}
