import type { NdisPaymentRoute } from "@prisma/client";
import { Prisma } from "@prisma/client";

import {
  mergeValidationJson,
  validateClaimLinesForBatch,
} from "@/lib/ndis/claiming/validation";
import { prisma } from "@/lib/prisma";

export type CreateBatchInput = {
  providerOrgId: string;
  paymentRoute: NdisPaymentRoute;
  claimLineIds: string[];
  createdById: string;
  batchReference?: string;
};

export async function createClaimBatch(input: CreateBatchInput) {
  const validation = await validateClaimLinesForBatch(
    input.claimLineIds,
    input.paymentRoute,
    input.providerOrgId
  );
  if (!validation.valid) {
    return { ok: false as const, validation };
  }

  const batch = await prisma.$transaction(async (tx) => {
    const created = await tx.ndisClaimBatch.create({
      data: {
        providerOrgId: input.providerOrgId,
        paymentRoute: input.paymentRoute,
        status: "validated",
        batchReference:
          input.batchReference ??
          `MAP-BATCH-${Date.now().toString(36).toUpperCase()}`,
        createdById: input.createdById,
        metadataJson: mergeValidationJson(validation) as Prisma.InputJsonValue,
      },
    });

    await tx.ndisClaimLine.updateMany({
      where: { id: { in: input.claimLineIds } },
      data: {
        batchId: created.id,
        status: "included_in_batch",
      },
    });

    await tx.claimAuditEvent.create({
      data: {
        batchId: created.id,
        entityType: "ndis_claim_batch",
        entityId: created.id,
        action: "batch.created",
        actorUserId: input.createdById,
        afterJson: {
          status: created.status,
          lineCount: input.claimLineIds.length,
          paymentRoute: input.paymentRoute,
        },
      },
    });

    for (const lineId of input.claimLineIds) {
      await tx.claimAuditEvent.create({
        data: {
          claimLineId: lineId,
          batchId: created.id,
          entityType: "ndis_claim_line",
          entityId: lineId,
          action: "line.included_in_batch",
          actorUserId: input.createdById,
          afterJson: { batchId: created.id, status: "included_in_batch" },
        },
      });
    }

    return created;
  });

  return { ok: true as const, batch, validation };
}

export async function validateClaimBatch(batchId: string) {
  const batch = await prisma.ndisClaimBatch.findUnique({
    where: { id: batchId },
    include: { lines: true },
  });
  if (!batch) return { ok: false as const, error: "Batch not found" };

  const validation = await validateClaimLinesForBatch(
    batch.lines.map((l) => l.id),
    batch.paymentRoute,
    batch.providerOrgId
  );

  const nextStatus = validation.valid ? "validated" : "draft";
  const updated = await prisma.ndisClaimBatch.update({
    where: { id: batchId },
    data: {
      status: nextStatus,
      metadataJson: mergeValidationJson(validation) as Prisma.InputJsonValue,
    },
  });

  await prisma.claimAuditEvent.create({
    data: {
      batchId,
      entityType: "ndis_claim_batch",
      entityId: batchId,
      action: "batch.validated",
      afterJson: { status: nextStatus, valid: validation.valid },
    },
  });

  return { ok: true as const, batch: updated, validation };
}
