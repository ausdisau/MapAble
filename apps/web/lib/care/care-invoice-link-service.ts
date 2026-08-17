import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { assertProviderOrgAccess } from "@/lib/care/access-control";
import { prisma } from "@/lib/prisma";

export async function createInvoicePlaceholderForBooking(
  careBookingId: string,
  actorUser: CurrentUser
) {
  const booking = await prisma.careBooking.findUnique({
    where: { id: careBookingId },
    include: { serviceLogs: true },
  });
  if (!booking) throw new Error("NOT_FOUND");
  await assertProviderOrgAccess(actorUser, booking.organisationId);

  const confirmedLog = booking.serviceLogs.find((l) => l.status === "confirmed");
  if (!confirmedLog) {
    throw new Error("SERVICE_LOG_REQUIRED");
  }

  const existing = await prisma.careInvoiceLink.findFirst({
    where: { careBookingId, status: "placeholder" },
  });
  if (existing) return existing;

  const link = await prisma.careInvoiceLink.create({
    data: {
      careBookingId,
      organisationId: booking.organisationId,
      careServiceLogId: confirmedLog.id,
      status: "placeholder",
      pricingPlaceholder:
        "Pricing placeholder — connect NDIS Pricing Intelligence for line items.",
      ndisLineItemCodePlaceholder: booking.careRequestId
        ? undefined
        : undefined,
      externalInvoiceRef: `INV-PLACEHOLDER-${careBookingId.slice(0, 8)}`,
    },
  });

  await createAuditEvent({
    actorUserId: actorUser.id,
    action: "care_invoice.placeholder_created",
    entityType: "CareInvoiceLink",
    entityId: link.id,
    organisationId: booking.organisationId,
    participantId: booking.participantId,
  });

  return link;
}
