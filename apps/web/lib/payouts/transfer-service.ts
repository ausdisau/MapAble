import { isConnectPayoutsEnabled } from "@/lib/billing/config";
import { writeBillingAuditLog } from "@/lib/billing/core/audit";
import { isBillingStripeConfigured } from "@/lib/billing/core/config";
import { isPayoutsEnabled } from "@/lib/payouts/config";
import { splitTransferIdempotencyKey } from "@/lib/payouts/payout-policy";
import { canReleasePayout } from "@/lib/payouts/readiness-service";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe/client";

export async function createTransferForPayoutSplit(payoutSplitId: string) {
  if (!isPayoutsEnabled() && !isConnectPayoutsEnabled()) {
    return {
      ok: false as const,
      error:
        "Stripe Connect payouts are disabled. Set MAPABLE_PAYOUTS_ENABLED=true only after authenticated environment testing.",
    };
  }

  if (!isBillingStripeConfigured()) {
    return { ok: false as const, error: "Stripe is not configured" };
  }

  const split = await prisma.billingPaymentSplit.findUnique({
    where: { id: payoutSplitId },
    include: {
      payment: { include: { invoice: true, payoutBlocks: { where: { status: "active" } } } },
      payoutRecipient: true,
    },
  });

  if (!split) return { ok: false as const, error: "Split not found" };
  if (split.status !== "ready") {
    return { ok: false as const, error: `Split status is ${split.status}, expected ready` };
  }

  const readiness = await canReleasePayout(split.paymentId);
  if (!readiness.eligible) {
    return { ok: false as const, error: readiness.blockers.join(" ") };
  }

  let recipient = split.payoutRecipient;
  if (!recipient && split.recipientId) {
    recipient = await prisma.payoutRecipient.findFirst({
      where: {
        OR: [
          { id: split.recipientId },
          { userId: split.recipientId },
          { providerOrgId: split.recipientId },
          { workerId: split.recipientId },
        ],
      },
    });
  }

  const stripeAccountId =
    recipient?.stripeAccountId ?? split.stripeConnectedAccountId;
  if (!stripeAccountId) {
    return { ok: false as const, error: "Recipient has no Stripe connected account" };
  }

  if (!recipient) {
    return {
      ok: false as const,
      error: "Payout recipient record required before transfer",
    };
  }

  const amountCents = split.netTransferCents ?? split.amountCents;
  if (amountCents <= 0) {
    return { ok: false as const, error: "Transfer amount must be greater than zero" };
  }

  const idempotencyKey =
    split.idempotencyKey ?? splitTransferIdempotencyKey(split.id);
  const existingTransfer = await prisma.payoutTransfer.findUnique({
    where: { idempotencyKey },
  });
  if (existingTransfer?.stripeTransferId) {
    return { ok: true as const, transfer: existingTransfer, duplicate: true };
  }

  const stripe = getStripeClient();
  const transferGroup =
    split.payment.transferGroup ??
    split.payment.invoice?.transferGroup ??
    undefined;

  try {
    const stripeTransfer = await stripe.transfers.create(
      {
        amount: amountCents,
        currency: (split.payment.currency ?? "aud").toLowerCase(),
        destination: stripeAccountId,
        transfer_group: transferGroup,
        metadata: {
          paymentId: split.paymentId,
          bookingId: split.payment.invoice?.bookingId ?? "",
          payoutSplitId: split.id,
          recipientId: recipient?.id ?? split.recipientId ?? "",
          bookingType: split.payment.invoice?.serviceType ?? "",
        },
      },
      { idempotencyKey }
    );

    const payoutTransfer = await prisma.payoutTransfer.upsert({
      where: { idempotencyKey },
      create: {
        payoutSplitId: split.id,
        recipientId: recipient!.id,
        stripeTransferId: stripeTransfer.id,
        amountCents,
        currency: split.payment.currency,
        status: "created",
        transferGroup: transferGroup ?? null,
        idempotencyKey,
      },
      update: {
        stripeTransferId: stripeTransfer.id,
        status: "created",
      },
    });

    await prisma.billingPaymentSplit.update({
      where: { id: split.id },
      data: {
        status: "transfer_created",
        transferId: stripeTransfer.id,
        idempotencyKey,
      },
    });

    await writeBillingAuditLog({
      entityType: "PayoutTransfer",
      entityId: payoutTransfer.id,
      action: "stripe_transfer_created",
      after: {
        stripeTransferId: stripeTransfer.id,
        amountCents,
        payoutSplitId: split.id,
      },
    });

    return { ok: true as const, transfer: payoutTransfer, duplicate: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transfer failed";
    await prisma.billingPaymentSplit.update({
      where: { id: split.id },
      data: { status: "failed", blockReason: message },
    });
    await writeBillingAuditLog({
      entityType: "BillingPaymentSplit",
      entityId: split.id,
      action: "stripe_transfer_failed",
      after: { error: message },
    });
    return { ok: false as const, error: message };
  }
}

export async function createTransferReversal(
  payoutTransferId: string,
  amountCents: number,
  actorUserId: string
) {
  const record = await prisma.payoutTransfer.findUnique({
    where: { id: payoutTransferId },
  });
  if (!record?.stripeTransferId) {
    throw new Error("Transfer not found or not created in Stripe");
  }

  const stripe = getStripeClient();
  const reversal = await stripe.transfers.createReversal(record.stripeTransferId, {
    amount: amountCents,
  });

  await prisma.payoutTransfer.update({
    where: { id: payoutTransferId },
    data: { status: "reversed" },
  });

  await writeBillingAuditLog({
    actorUserId,
    entityType: "PayoutTransfer",
    entityId: payoutTransferId,
    action: "transfer_reversal_created",
    after: { reversalId: reversal.id, amountCents },
  });

  return reversal;
}
