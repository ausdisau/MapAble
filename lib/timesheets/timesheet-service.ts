import { calculateNdisItemDraft } from "@/lib/act/billing/ndis-item-calculator";
import { isActLayerEnabled } from "@/lib/act/flags";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { createInvoiceDraftFromBooking } from "@/lib/invoices/invoice-service";
import { prisma } from "@/lib/prisma";

export async function createTimesheetFromCareShift(
  shiftId: string,
  _workerUserId: string
) {
  const shift = await prisma.careShift.findUnique({
    where: { id: shiftId },
    include: { careRequest: true },
  });
  if (!shift) throw new Error("NOT_FOUND");

  return prisma.timesheet.upsert({
    where: { careShiftId: shiftId },
    create: {
      careShiftId: shiftId,
      participantId: shift.participantId,
      workerProfileId: shift.workerProfileId,
      organisationId: shift.organisationId,
      scheduledStart: shift.startAt,
      scheduledEnd: shift.endAt,
      supportItemCode: shift.careRequest?.supportItemCode,
      status: "draft",
    },
    update: {},
  });
}

export async function submitTimesheet(timesheetId: string, actorUserId: string) {
  const ts = await prisma.timesheet.update({
    where: { id: timesheetId },
    data: { status: "submitted", submittedAt: new Date() },
  });

  await createAuditEvent({
    actorUserId,
    action: "timesheet.submitted",
    entityType: "Timesheet",
    entityId: timesheetId,
    participantId: ts.participantId,
  });

  await notifyParticipantReview(ts.participantId, timesheetId);
  return ts;
}

async function notifyParticipantReview(participantId: string, _timesheetId: string) {
  const { notifyUser } = await import("@/lib/notifications/notification-service");
  await notifyUser(
    participantId,
    "booking",
    "Timesheet ready for your review",
    "Please review and approve or dispute the completed support record."
  );
}

export async function approveTimesheet(
  timesheetId: string,
  participantId: string
) {
  const ts = await prisma.timesheet.update({
    where: { id: timesheetId },
    data: { status: "approved", approvedAt: new Date() },
  });

  if (ts.participantId !== participantId) throw new Error("FORBIDDEN");

  await createAuditEvent({
    actorUserId: participantId,
    action: "timesheet.approved",
    entityType: "Timesheet",
    entityId: timesheetId,
    participantId,
  });

  const { createAttestation } = await import("@/lib/attestations/attestation-service");
  await createAttestation({
    type: "participant_approved_timesheet",
    actorUserId: participantId,
    participantId,
    entityType: "Timesheet",
    entityId: timesheetId,
    claim: "Participant approved timesheet for completed support",
  });

  return ts;
}

export async function disputeTimesheet(
  timesheetId: string,
  participantId: string,
  reason: string
) {
  return prisma.timesheet.update({
    where: { id: timesheetId },
    data: { status: "disputed", rejectedReason: reason },
  });
}

export async function createInvoiceLineFromTimesheet(
  timesheetId: string,
  adminUserId: string
) {
  const ts = await prisma.timesheet.findUnique({
    where: { id: timesheetId },
    include: { careShift: { include: { booking: true, careRequest: true } } },
  });
  if (!ts || ts.status !== "approved") throw new Error("NOT_APPROVED");

  const shift = ts.careShift;
  let invoice =
    shift.bookingId &&
    (await prisma.invoice.findFirst({ where: { bookingId: shift.bookingId } }));

  if (!invoice) {
    if (shift.bookingId) {
      invoice = await createInvoiceDraftFromBooking(shift.bookingId, adminUserId);
    } else {
      invoice = await prisma.invoice.create({
        data: {
          participantId: ts.participantId,
          organisationId: ts.organisationId,
          status: "draft",
          createdById: adminUserId,
        },
      });
    }
  }

  const supportItemCode =
    ts.supportItemCode ?? shift.careRequest?.supportItemCode ?? null;

  let unitAmountCents = 0;
  let totalAmountCents = 0;
  let quantity = 1;
  let description = "Approved support session — requires review";

  // Act layer: non-zero draft amounts behind flag; still requires human review.
  if (isActLayerEnabled() && supportItemCode) {
    const start = ts.actualStart ?? ts.scheduledStart;
    const end = ts.actualEnd ?? ts.scheduledEnd;
    const hours = Math.max(
      0.25,
      (end.getTime() - start.getTime()) / (1000 * 60 * 60),
    );
    try {
      const draft = calculateNdisItemDraft({
        supportItemCode,
        hours,
      });
      unitAmountCents = draft.unitRateCents;
      totalAmountCents = draft.totalAmountCents;
      quantity = draft.quantityHours;
      description = `${draft.description} [draft_requires_review]`;
    } catch {
      // Unknown catalogue code — keep $0 draft for human pricing.
      description =
        "Approved support session — Act draft unavailable; requires review";
    }
  }

  await prisma.invoiceLine.create({
    data: {
      invoiceId: invoice.id,
      description,
      serviceDate: ts.actualStart ?? ts.scheduledStart,
      quantity,
      unitAmountCents,
      totalAmountCents,
      supportItemCode,
      claimableByNdis: Boolean(supportItemCode),
    },
  });

  await prisma.timesheet.update({
    where: { id: timesheetId },
    data: { status: "invoice_ready" },
  });

  await createAuditEvent({
    actorUserId: adminUserId,
    action: "timesheet.invoice_line_drafted",
    entityType: "Timesheet",
    entityId: timesheetId,
    metadata: {
      invoiceId: invoice.id,
      supportItemCode,
      unitAmountCents,
      totalAmountCents,
      actLayer: isActLayerEnabled(),
      status: "draft_requires_review",
    },
  });

  return { invoice };
}
