import type {
  BillingCentreClaimGateway,
  BillingClaimBatch,
  MapAbleUserRole,
} from "@prisma/client";

import { writeFinancialAudit } from "@/lib/billing/audit/financial-audit";
import {
  getClaimsGateway,
  type ClaimsGatewayName,
} from "@/lib/billing/claims/gateway";
import { prisma } from "@/lib/prisma";
import type {
  ClaimSubmissionResult,
  ClaimValidationResult,
} from "@/types/billing";

export type CreateClaimBatchInput = {
  organisationId: string;
  invoiceIds: string[];
  gateway?: ClaimsGatewayName | BillingCentreClaimGateway;
  createdById?: string | null;
  actorId?: string | null;
  actorRole?: MapAbleUserRole | string | null;
};

export async function createClaimBatch(
  input: CreateClaimBatchInput
): Promise<BillingClaimBatch> {
  const gatewayName = (input.gateway ?? "mock") as BillingCentreClaimGateway;

  const invoices = await prisma.billingInvoice.findMany({
    where: {
      id: { in: input.invoiceIds },
      providerId: input.organisationId,
    },
    include: { lineItems: true },
  });

  if (invoices.length === 0) {
    throw new Error("No invoices found for claim batch");
  }

  const batch = await prisma.billingClaimBatch.create({
    data: {
      organisationId: input.organisationId,
      gateway: gatewayName,
      status: "NOT_READY",
      simulated: true,
      createdById: input.createdById ?? input.actorId ?? undefined,
      items: {
        create: invoices.flatMap((inv) =>
          inv.lineItems.map((li) => ({
            invoiceId: inv.id,
            supportItemCode: li.ndisLineItem ?? undefined,
            amountCents: li.totalCents,
            status: "NOT_READY",
          }))
        ),
      },
    },
    include: { items: true },
  });

  await writeFinancialAudit({
    organisationId: input.organisationId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "claim_batch_created",
    entityType: "BillingClaimBatch",
    entityId: batch.id,
    newValues: {
      gateway: gatewayName,
      invoiceIds: input.invoiceIds,
      simulated: true,
    },
  });

  return batch;
}

export async function validateClaimBatch(
  batchId: string
): Promise<ClaimValidationResult> {
  const batch = await prisma.billingClaimBatch.findUnique({
    where: { id: batchId },
  });
  if (!batch) {
    throw new Error(`Claim batch not found: ${batchId}`);
  }

  const gateway = getClaimsGateway(batch.gateway);
  const result = await gateway.validate(batchId);

  await prisma.billingClaimBatch.update({
    where: { id: batchId },
    data: {
      status: result.valid ? "READY" : "NOT_READY",
      validationJson: result as object,
      simulated: true,
    },
  });

  return result;
}

export async function exportClaimBatch(
  batchId: string,
  actor?: {
    actorId?: string | null;
    actorRole?: MapAbleUserRole | string | null;
  }
): Promise<ClaimSubmissionResult> {
  const batch = await prisma.billingClaimBatch.findUnique({
    where: { id: batchId },
  });
  if (!batch) {
    throw new Error(`Claim batch not found: ${batchId}`);
  }

  const gateway = getClaimsGateway(batch.gateway);
  const result = await gateway.submit(batchId);

  await writeFinancialAudit({
    organisationId: batch.organisationId,
    actorId: actor?.actorId,
    actorRole: actor?.actorRole,
    action: "claim_batch_exported",
    entityType: "BillingClaimBatch",
    entityId: batchId,
    newValues: {
      status: result.status,
      externalReference: result.externalReference,
      simulated: true,
      message: result.message,
    },
  });

  return result;
}
