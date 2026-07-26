import { writeBillingAuditLog } from "@/lib/billing/core/audit";
import { createTransferForPayoutSplit } from "@/lib/payouts/transfer-service";
import { prisma } from "@/lib/prisma";

function batchNumber(): string {
  const now = new Date();
  return `PB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Date.now().toString(36).toUpperCase()}`;
}

export async function createPayoutBatchFromReadySplits(splitIds: string[]) {
  const splits = await prisma.billingPaymentSplit.findMany({
    where: { id: { in: splitIds }, status: "ready" },
  });

  const totalNet = splits.reduce(
    (sum, s) => sum + (s.netTransferCents ?? s.amountCents),
    0
  );
  const totalGross = splits.reduce(
    (sum, s) => sum + (s.grossShareCents ?? s.amountCents),
    0
  );

  return prisma.payoutBatch.create({
    data: {
      batchNumber: batchNumber(),
      status: "review_required",
      totalGrossCents: totalGross,
      totalNetTransferCents: totalNet,
    },
  });
}

export async function approvePayoutBatch(
  batchId: string,
  approvedByUserId: string
) {
  const batch = await prisma.payoutBatch.update({
    where: { id: batchId },
    data: {
      status: "approved",
      approvedByUserId,
      approvedAt: new Date(),
    },
  });

  await writeBillingAuditLog({
    actorUserId: approvedByUserId,
    entityType: "PayoutBatch",
    entityId: batchId,
    action: "batch_approved",
  });

  return batch;
}

export async function processPayoutBatch(batchId: string, splitIds: string[]) {
  await prisma.payoutBatch.update({
    where: { id: batchId },
    data: { status: "processing" },
  });

  const results: Array<{
    splitId: string;
    ok: boolean;
    error?: string;
  }> = [];

  for (const splitId of splitIds) {
    const result = await createTransferForPayoutSplit(splitId);
    results.push({
      splitId,
      ok: result.ok,
      error: result.ok ? undefined : result.error,
    });

    if (result.ok && result.transfer) {
      await prisma.payoutTransfer.update({
        where: { id: result.transfer.id },
        data: { payoutBatchId: batchId },
      });
    }
  }

  const failed = results.filter((r) => !r.ok).length;
  const status =
    failed === 0
      ? "completed"
      : failed === results.length
        ? "failed"
        : "partially_failed";

  const batch = await prisma.payoutBatch.update({
    where: { id: batchId },
    data: {
      status,
      processedAt: new Date(),
    },
  });

  await writeBillingAuditLog({
    entityType: "PayoutBatch",
    entityId: batchId,
    action: "batch_processed",
    after: { status, failed, total: results.length },
  });

  return { batch, results };
}

export async function listPayoutQueue() {
  return prisma.billingPaymentSplit.findMany({
    where: { status: { in: ["ready", "blocked", "failed", "transfer_created"] } },
    include: {
      payment: {
        include: {
          invoice: { include: { booking: true } },
        },
      },
      payoutRecipient: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}
