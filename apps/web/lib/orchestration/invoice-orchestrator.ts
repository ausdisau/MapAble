import { phase3Config } from "@/lib/config/phase3";
import { createInvoiceDraftFromBooking } from "@/lib/invoices/invoice-service";
import { prisma } from "@/lib/prisma";

export async function createInvoiceLinesFromApprovedCareShift(
  shiftId: string,
  adminUserId: string
) {
  if (!phase3Config.orchestrationEnabled) {
    return { skipped: true };
  }

  const key = `invoice-shift-${shiftId}`;
  const existing = await prisma.orchestrationEvent.findUnique({
    where: { idempotencyKey: key },
  });
  if (existing) return { duplicate: true };

  const shift = await prisma.careShift.findUnique({
    where: { id: shiftId },
    include: { careRequest: true },
  });
  if (!shift || shift.status !== "approved") {
    throw new Error("SHIFT_NOT_APPROVED");
  }

  let invoice = shift.bookingId
    ? await prisma.invoice.findFirst({ where: { bookingId: shift.bookingId } })
    : null;

  if (!invoice) {
    if (shift.bookingId) {
      invoice = await createInvoiceDraftFromBooking(
        shift.bookingId,
        adminUserId
      );
    } else {
      invoice = await prisma.invoice.create({
        data: {
          participantId: shift.participantId,
          organisationId: shift.organisationId,
          status: "draft",
          createdById: adminUserId,
          lines: {
            create: [
              {
                description: "Approved care shift support",
                serviceDate: shift.startAt,
                quantity: 1,
                unitAmountCents: 0,
                totalAmountCents: 0,
              },
            ],
          },
        },
      });
    }
  } else {
    await prisma.invoiceLine.create({
      data: {
        invoiceId: invoice.id,
        description: "Approved care shift — requires review",
        serviceDate: shift.startAt,
        quantity: 1,
        unitAmountCents: 0,
        totalAmountCents: 0,
        supportItemCode: shift.careRequest?.supportItemCode ?? undefined,
        claimableByNdis: Boolean(shift.careRequest?.supportItemCode),
      },
    });
  }

  await prisma.orchestrationEvent.create({
    data: {
      eventType: "invoice_from_care_shift",
      careShiftId: shiftId,
      idempotencyKey: key,
      createdById: adminUserId,
      metadata: { invoiceId: invoice.id },
    },
  });

  return { invoice };
}
