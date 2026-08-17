import type { BillingPaymentSplitStatus, PayoutBlockReason, PayoutBlockSeverity } from "@prisma/client";

import { writeBillingAuditLog } from "@/lib/billing/core/audit";
import { prisma } from "@/lib/prisma";

export async function blockPayout(
  paymentId: string,
  reason: PayoutBlockReason,
  options?: {
    payoutSplitId?: string;
    severity?: PayoutBlockSeverity;
    createdBy?: string;
    notes?: string;
  }
) {
  const payment = await prisma.billingPayment.findUnique({
    where: { id: paymentId },
    include: { splits: true },
  });
  if (!payment) throw new Error("Payment not found");

  const block = await prisma.payoutBlock.create({
    data: {
      paymentId,
      invoiceId: payment.invoiceId,
      payoutSplitId: options?.payoutSplitId,
      reason,
      severity: options?.severity ?? "warning",
      status: "active",
      createdBy: options?.createdBy,
      notes: options?.notes,
    },
  });

  const blockableStatuses: BillingPaymentSplitStatus[] = [
    "pending_service",
    "ready",
    "pending",
  ];
  const splitFilter = options?.payoutSplitId
    ? { id: options.payoutSplitId }
    : { paymentId, status: { in: blockableStatuses } };

  await prisma.billingPaymentSplit.updateMany({
    where: splitFilter,
    data: {
      status: "blocked",
      blockReason: options?.notes ?? reason,
    },
  });

  await writeBillingAuditLog({
    actorUserId: options?.createdBy,
    entityType: "PayoutBlock",
    entityId: block.id,
    action: "payout_blocked",
    after: { paymentId, reason },
  });

  return block;
}

export async function resolvePayoutBlock(
  blockId: string,
  resolvedBy: string
) {
  const block = await prisma.payoutBlock.update({
    where: { id: blockId },
    data: {
      status: "resolved",
      resolvedBy,
      resolvedAt: new Date(),
    },
  });

  await writeBillingAuditLog({
    actorUserId: resolvedBy,
    entityType: "PayoutBlock",
    entityId: blockId,
    action: "payout_block_resolved",
  });

  return block;
}

export async function handleRefund(
  paymentId: string,
  refundAmountCents: number,
  actorUserId?: string
) {
  await prisma.billingPayment.update({
    where: { id: paymentId },
    data: { status: "refunded" },
  });

  const payment = await prisma.billingPayment.findUnique({
    where: { id: paymentId },
  });
  if (payment) {
    await prisma.billingInvoice.update({
      where: { id: payment.invoiceId },
      data: { status: "refunded", payoutStatus: "none" },
    });
  }

  await blockPayout(paymentId, "refund", {
    createdBy: actorUserId,
    notes: `Refund of ${refundAmountCents} cents recorded`,
    severity: "critical",
  });

  const transferred = await prisma.billingPaymentSplit.findMany({
    where: {
      paymentId,
      status: { in: ["transfer_created", "transferred"] },
    },
  });

  if (transferred.length > 0) {
    await writeBillingAuditLog({
      actorUserId,
      entityType: "BillingPayment",
      entityId: paymentId,
      action: "refund_requires_transfer_review",
      after: { transferredSplitIds: transferred.map((s) => s.id) },
    });
  }

  return { paymentId, refundAmountCents, requiresAdminReview: transferred.length > 0 };
}

export async function handleDispute(paymentId: string, actorUserId?: string) {
  await prisma.billingPayment.update({
    where: { id: paymentId },
    data: { status: "disputed" },
  });

  return blockPayout(paymentId, "dispute", {
    createdBy: actorUserId,
    severity: "critical",
    notes: "Payment disputed — payouts blocked pending review",
  });
}
