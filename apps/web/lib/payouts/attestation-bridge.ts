import { createAttestation } from "@/lib/attestations/attestation-service";
import { writeBillingAuditLog } from "@/lib/billing/core/audit";
import { markSplitsReadyForPayment } from "@/lib/payouts/readiness-service";
import { prisma } from "@/lib/prisma";

export async function attestServiceDelivered(params: {
  bookingId: string;
  actorUserId: string;
  claimType: string;
  evidence?: Record<string, unknown>;
}) {
  const attestation = await createAttestation({
    type: "worker_accepted_shift",
    entityType: "Booking",
    entityId: params.bookingId,
    claim: params.claimType,
    evidence: params.evidence,
    actorUserId: params.actorUserId,
  });

  await writeBillingAuditLog({
    actorUserId: params.actorUserId,
    entityType: "Attestation",
    entityId: attestation.id,
    action: "service_delivered_attested",
    after: { bookingId: params.bookingId },
  });

  return attestation;
}

export async function confirmServiceForBooking(params: {
  bookingId: string;
  actorUserId: string;
}) {
  const attestation = await createAttestation({
    type: "participant_confirmed_booking",
    entityType: "Booking",
    entityId: params.bookingId,
    claim: "participant_confirmed",
    actorUserId: params.actorUserId,
  });

  const invoice = await prisma.billingInvoice.findFirst({
    where: { bookingId: params.bookingId },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (invoice?.payments[0]) {
    await prisma.billingInvoice.update({
      where: { id: invoice.id },
      data: { payoutStatus: "service_completed" },
    });
    await prisma.billingPayment.update({
      where: { id: invoice.payments[0].id },
      data: { payoutStatus: "service_completed" },
    });
    await markSplitsReadyForPayment(invoice.payments[0].id);
  }

  await writeBillingAuditLog({
    actorUserId: params.actorUserId,
    entityType: "Booking",
    entityId: params.bookingId,
    action: "service_confirmed",
  });

  return attestation;
}

export async function disputeServiceForBooking(params: {
  bookingId: string;
  actorUserId: string;
  reason?: string;
}) {
  const attestation = await createAttestation({
    type: "participant_confirmed_booking",
    entityType: "Booking",
    entityId: params.bookingId,
    claim: params.reason ?? "service_disputed",
    actorUserId: params.actorUserId,
    evidence: { disputed: true },
  });

  await prisma.booking.update({
    where: { id: params.bookingId },
    data: { status: "disputed" },
  });

  const payment = await prisma.billingPayment.findFirst({
    where: { invoice: { bookingId: params.bookingId } },
  });
  if (payment) {
    const { blockPayout } = await import("@/lib/payouts/block-service");
    await blockPayout(payment.id, "complaint", {
      createdBy: params.actorUserId,
      notes: params.reason,
      severity: "critical",
    });
  }

  return attestation;
}
