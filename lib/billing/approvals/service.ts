import type {
  BillingApprovalDecision,
  BillingApprovalType,
  BillingInvoiceApproval,
  MapAbleUserRole,
} from "@prisma/client";

import { writeFinancialAudit } from "@/lib/billing/audit/financial-audit";
import { prisma } from "@/lib/prisma";

export type CreateApprovalInput = {
  invoiceId: string;
  approvalType: BillingApprovalType;
  actorId?: string | null;
  actorRole?: MapAbleUserRole | string | null;
  reason?: string;
  decision?: BillingApprovalDecision;
  organisationId?: string | null;
};

export async function createApproval(
  input: CreateApprovalInput
): Promise<BillingInvoiceApproval> {
  const invoice = await prisma.billingInvoice.findUnique({
    where: { id: input.invoiceId },
  });
  if (!invoice) {
    throw new Error(`Invoice not found: ${input.invoiceId}`);
  }

  const approval = await prisma.billingInvoiceApproval.create({
    data: {
      invoiceId: input.invoiceId,
      approvalType: input.approvalType,
      decision: input.decision ?? "pending",
      actorId: input.actorId ?? undefined,
      actorRole: input.actorRole ? String(input.actorRole) : undefined,
      reason: input.reason,
      decidedAt:
        input.decision && input.decision !== "pending"
          ? new Date()
          : undefined,
    },
  });

  await writeFinancialAudit({
    organisationId: input.organisationId ?? invoice.providerId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "invoice_approval_created",
    entityType: "BillingInvoiceApproval",
    entityId: approval.id,
    participantId: invoice.userId,
    newValues: {
      invoiceId: input.invoiceId,
      approvalType: input.approvalType,
      decision: approval.decision,
    },
  });

  return approval;
}

export type ListApprovalsInput = {
  invoiceId?: string;
  decision?: BillingApprovalDecision;
  approvalType?: BillingApprovalType;
  take?: number;
};

export async function listApprovals(
  input: ListApprovalsInput = {}
): Promise<BillingInvoiceApproval[]> {
  return prisma.billingInvoiceApproval.findMany({
    where: {
      ...(input.invoiceId ? { invoiceId: input.invoiceId } : {}),
      ...(input.decision ? { decision: input.decision } : {}),
      ...(input.approvalType ? { approvalType: input.approvalType } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: input.take ?? 100,
  });
}

export type DecideApprovalInput = {
  approvalId: string;
  decision: Exclude<BillingApprovalDecision, "pending">;
  actorId: string;
  actorRole?: MapAbleUserRole | string | null;
  reason?: string;
  organisationId?: string | null;
};

export async function decideApproval(
  input: DecideApprovalInput
): Promise<BillingInvoiceApproval> {
  const existing = await prisma.billingInvoiceApproval.findUnique({
    where: { id: input.approvalId },
    include: { invoice: true },
  });
  if (!existing) {
    throw new Error(`Approval not found: ${input.approvalId}`);
  }

  const updated = await prisma.billingInvoiceApproval.update({
    where: { id: input.approvalId },
    data: {
      decision: input.decision,
      actorId: input.actorId,
      actorRole: input.actorRole ? String(input.actorRole) : undefined,
      reason: input.reason,
      decidedAt: new Date(),
    },
  });

  await writeFinancialAudit({
    organisationId: input.organisationId ?? existing.invoice.providerId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "invoice_approval_decided",
    entityType: "BillingInvoiceApproval",
    entityId: updated.id,
    participantId: existing.invoice.userId,
    previousValues: { decision: existing.decision },
    newValues: { decision: updated.decision },
    reason: input.reason,
  });

  return updated;
}
