import { payoutPolicyDefaults } from "@/lib/payouts/config";
import type { PayoutReadinessResult } from "@/lib/payouts/types";
import { prisma } from "@/lib/prisma";
import { isSafeguardingTicket } from "@/lib/support/safeguarding-helpers";


export async function canReleasePayout(
  paymentId: string
): Promise<PayoutReadinessResult> {
  const blockers: string[] = [];
  const requiredActions: string[] = [];

  const payment = await prisma.billingPayment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: { include: { booking: true } },
      splits: { include: { payoutRecipient: true } },
      payoutBlocks: { where: { status: "active" } },
    },
  });

  if (!payment) {
    return {
      eligible: false,
      status: "not_found",
      blockers: ["Payment record not found."],
      requiredActions: [],
      attestations: [],
    };
  }

  const paid =
    payment.status === "succeeded" || payment.externalPaymentMarkedAt != null;
  if (!paid) {
    blockers.push("Payment has not been received yet.");
    requiredActions.push("Complete payment or mark external funding as received.");
  }

  if (payment.status === "disputed") {
    blockers.push("This payment is under dispute.");
  }

  if (payment.invoice?.status === "cancelled") {
    blockers.push("The booking invoice was cancelled.");
  }

  if (payment.invoice?.booking?.status === "cancelled") {
    blockers.push("The booking was cancelled.");
  }

  if (payment.invoice?.booking?.status === "disputed") {
    blockers.push("The booking is disputed.");
  }

  if (payment.payoutBlocks.length > 0) {
    blockers.push("An active payout hold is in place.");
  }

  const bookingId = payment.invoice?.bookingId;
  let serviceConfirmed = false;
  const attestations: Array<{ id: string; type: string; createdAt: Date }> = [];

  if (bookingId) {
    const careLog = await prisma.careServiceLog.findFirst({
      where: {
        status: "confirmed",
        OR: [
          { careShift: { careRequest: { bookingId } } },
          { careBooking: { careRequest: { bookingId } } },
        ],
      },
    });
    const transportBooking = await prisma.transportBooking.findFirst({
      where: { bookingId, status: "completed" },
    });
    const transportTrip = transportBooking
      ? await prisma.transportTrip.findFirst({
          where: {
            legacyTransportBookingId: transportBooking.id,
            status: { in: ["trip_completed", "evidence_submitted", "closed", "participant_review"] },
          },
        })
      : null;
    serviceConfirmed = Boolean(careLog || transportBooking || transportTrip);

    const attestationRows = await prisma.attestation.findMany({
      where: {
        entityType: { in: ["CareServiceLog", "TransportTrip", "Booking"] },
        entityId: { in: [bookingId, careLog?.id, transportTrip?.id].filter(Boolean) as string[] },
        status: "recorded",
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    attestations.push(
      ...attestationRows.map((a) => ({
        id: a.id,
        type: a.type,
        createdAt: a.createdAt,
      }))
    );

    if (!serviceConfirmed) {
      blockers.push("Service delivery has not been confirmed.");
      requiredActions.push("Submit and confirm the service record.");
    }
  } else {
    blockers.push("No booking linked to this payment.");
  }

  if (payoutPolicyDefaults.blockOnSafeguardingFlag && bookingId) {
    const participantId = payment.invoice?.booking?.participantId;
    if (participantId) {
      const tickets = await prisma.supportTicket.findMany({
        where: {
          createdById: participantId,
          status: { in: ["open", "triage", "escalated", "waiting_on_user", "waiting_on_provider"] },
        },
        take: 20,
      });
      if (tickets.some((t) => isSafeguardingTicket(t))) {
        blockers.push("A safeguarding review is open for this participant.");
      }
    }
  }

  for (const split of payment.splits) {
    if ((split.netTransferCents ?? split.amountCents) <= 0) continue;

    if (split.status === "blocked") {
      blockers.push(split.blockReason ?? "A payout split is blocked.");
    }

    if (payoutPolicyDefaults.blockOnIncompleteRecipientOnboarding) {
      const recipient = split.payoutRecipient;
      if (recipient && recipient.stripeOnboardingStatus !== "enabled") {
        blockers.push(
          `${recipient.displayName} must complete Stripe payout setup.`
        );
        requiredActions.push("Complete Stripe connected account onboarding.");
      }
    }
  }

  if (payment.providerId) {
    const hold = await prisma.providerPayoutHold.findFirst({
      where: { organisationId: payment.providerId, active: true },
    });
    if (hold) {
      blockers.push(`Provider payout hold: ${hold.reason}`);
    }
  }

  const eligible = blockers.length === 0 && paid && serviceConfirmed;

  return {
    eligible,
    status: eligible ? "ready" : "blocked",
    blockers,
    requiredActions,
    attestations,
  };
}

export async function markSplitsReadyForPayment(paymentId: string) {
  const readiness = await canReleasePayout(paymentId);
  if (!readiness.eligible) {
    return { ok: false as const, readiness };
  }

  await prisma.billingPaymentSplit.updateMany({
    where: {
      paymentId,
      status: { in: ["pending_service", "pending"] },
    },
    data: { status: "ready" },
  });

  await prisma.billingPayment.update({
    where: { id: paymentId },
    data: { payoutStatus: "payout_pending" },
  });

  if (readiness.attestations.length > 0) {
    await prisma.billingInvoice.updateMany({
      where: {
        payments: { some: { id: paymentId } },
      },
      data: { payoutStatus: "payout_pending" },
    });
  }

  return { ok: true as const, readiness };
}
