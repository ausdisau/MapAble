import type { BillingInvoice, MapAbleUserRole } from "@prisma/client";

import { writeFinancialAudit } from "@/lib/billing/audit/financial-audit";
import {
  assertCanTransition,
  normalizeLegacyStatus,
} from "@/lib/billing/invoicing/state-machine";
import { listBillingPermissions } from "@/lib/billing/permissions";
import { prisma } from "@/lib/prisma";
import type {
  BillingInvoiceState,
  BillingPermission,
  InvoiceTransitionRecord,
} from "@/types/billing";

export type TransitionInvoiceInput = {
  invoiceId: string;
  to: BillingInvoiceState;
  actorId: string;
  actorRole: MapAbleUserRole | string;
  reason?: string;
  relatedEvidenceIds?: string[];
  ip?: string | null;
  sessionId?: string | null;
  /** Extra permissions beyond role defaults (e.g. delegated grants). */
  extraPermissions?: BillingPermission[];
  organisationId?: string | null;
};

async function nextInvoiceNumber(prefix = "MAP"): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await prisma.$transaction(async (tx) => {
    const existing = await tx.billingInvoiceNumberSequence.findUnique({
      where: { prefix_year: { prefix, year } },
    });
    if (existing) {
      return tx.billingInvoiceNumberSequence.update({
        where: { id: existing.id },
        data: { lastValue: { increment: 1 } },
      });
    }
    return tx.billingInvoiceNumberSequence.create({
      data: { prefix, year, lastValue: 1 },
    });
  });
  const padded = String(seq.lastValue).padStart(6, "0");
  return `${prefix}-${year}-${padded}`;
}

/**
 * Transition invoice status via state machine with audit + transition row.
 */
export async function transitionInvoice(
  input: TransitionInvoiceInput
): Promise<{ invoice: BillingInvoice; transition: InvoiceTransitionRecord }> {
  const invoice = await prisma.billingInvoice.findUnique({
    where: { id: input.invoiceId },
  });
  if (!invoice) {
    throw new Error(`Invoice not found: ${input.invoiceId}`);
  }

  const from = normalizeLegacyStatus(invoice.status);
  const rolePermissions = listBillingPermissions(
    input.actorRole as MapAbleUserRole
  );
  const actorPermissions = [
    ...new Set([...(input.extraPermissions ?? []), ...rolePermissions]),
  ];

  assertCanTransition({
    from,
    to: input.to,
    actorPermissions,
    reason: input.reason,
  });

  const updated = await prisma.billingInvoice.update({
    where: { id: invoice.id },
    data: {
      status: input.to,
      ...(input.to === "issued" || input.to === "sent"
        ? { issuedAt: invoice.issuedAt ?? new Date() }
        : {}),
      ...(input.to === "paid" ? { paidAt: new Date() } : {}),
      ...(input.to === "disputed"
        ? { disputedAt: new Date(), disputeReason: input.reason }
        : {}),
    },
  });

  await prisma.billingInvoiceTransition.create({
    data: {
      invoiceId: invoice.id,
      actorId: input.actorId,
      actorRole: String(input.actorRole),
      priorState: from,
      newState: input.to,
      reason: input.reason,
      evidenceIds: input.relatedEvidenceIds,
      ipAddress: input.ip ?? undefined,
      sessionId: input.sessionId ?? undefined,
    },
  });

  const occurredAt = new Date().toISOString();
  const transition: InvoiceTransitionRecord = {
    actorId: input.actorId,
    actorRole: String(input.actorRole),
    priorState: from,
    newState: input.to,
    reason: input.reason,
    relatedEvidenceIds: input.relatedEvidenceIds,
    ip: input.ip ?? null,
    sessionId: input.sessionId ?? null,
    occurredAt,
  };

  await writeFinancialAudit({
    organisationId: input.organisationId ?? invoice.providerId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "invoice_transition",
    entityType: "BillingInvoice",
    entityId: invoice.id,
    participantId: invoice.userId,
    previousValues: { status: from },
    newValues: { status: input.to },
    reason: input.reason,
    policyVersionId: invoice.policyVersionId ?? undefined,
  });

  return { invoice: updated, transition };
}

export type IssueInvoiceInput = {
  invoiceId: string;
  actorId: string;
  actorRole: MapAbleUserRole | string;
  reason?: string;
  organisationId?: string | null;
};

/**
 * Allocate invoice number and transition to issued (via ready_to_issue if needed).
 */
export async function issueInvoice(
  input: IssueInvoiceInput
): Promise<BillingInvoice> {
  const invoice = await prisma.billingInvoice.findUnique({
    where: { id: input.invoiceId },
  });
  if (!invoice) {
    throw new Error(`Invoice not found: ${input.invoiceId}`);
  }

  let current = normalizeLegacyStatus(invoice.status);

  if (current === "approved") {
    await transitionInvoice({
      ...input,
      to: "ready_to_issue",
      reason: input.reason ?? "Preparing to issue",
    });
    current = "ready_to_issue";
  }

  if (current !== "ready_to_issue" && current !== "issued") {
    throw new Error(
      `Cannot issue invoice from status ${current}; must be ready_to_issue or approved`
    );
  }

  let invoiceNumber = invoice.invoiceNumber;
  if (!invoiceNumber) {
    invoiceNumber = await nextInvoiceNumber();
    await prisma.billingInvoice.update({
      where: { id: invoice.id },
      data: { invoiceNumber },
    });
  }

  if (current === "ready_to_issue") {
    const { invoice: issued } = await transitionInvoice({
      ...input,
      to: "issued",
      reason: input.reason ?? "Invoice issued",
    });
    return issued;
  }

  return prisma.billingInvoice.findUniqueOrThrow({
    where: { id: invoice.id },
  });
}

export type RequestApprovalInput = {
  invoiceId: string;
  approvalType: "participant" | "provider" | "mapable_finance";
  actorId: string;
  actorRole: MapAbleUserRole | string;
  reason?: string;
  organisationId?: string | null;
};

/**
 * Move invoice into the appropriate review state and create a pending approval.
 */
export async function requestApproval(
  input: RequestApprovalInput
): Promise<{ invoice: BillingInvoice; approvalId: string }> {
  const targetStatus: BillingInvoiceState =
    input.approvalType === "participant"
      ? "participant_review"
      : input.approvalType === "provider"
        ? "provider_review"
        : "provider_review";

  const { invoice } = await transitionInvoice({
    invoiceId: input.invoiceId,
    to: targetStatus,
    actorId: input.actorId,
    actorRole: input.actorRole,
    reason: input.reason ?? `Requested ${input.approvalType} approval`,
    organisationId: input.organisationId,
  });

  const approval = await prisma.billingInvoiceApproval.create({
    data: {
      invoiceId: input.invoiceId,
      approvalType: input.approvalType,
      decision: "pending",
      actorId: input.actorId,
      actorRole: String(input.actorRole),
      reason: input.reason,
    },
  });

  return { invoice, approvalId: approval.id };
}

export type ApproveInvoiceInput = {
  invoiceId: string;
  approvalType: "participant" | "provider" | "mapable_finance";
  actorId: string;
  actorRole: MapAbleUserRole | string;
  decision?: "approved" | "rejected" | "changes_requested";
  reason?: string;
  organisationId?: string | null;
};

/**
 * Record approval decision and advance state machine when approved.
 */
export async function approveInvoice(
  input: ApproveInvoiceInput
): Promise<BillingInvoice> {
  const decision = input.decision ?? "approved";

  const pending = await prisma.billingInvoiceApproval.findFirst({
    where: {
      invoiceId: input.invoiceId,
      approvalType: input.approvalType,
      decision: "pending",
    },
    orderBy: { createdAt: "desc" },
  });

  if (pending) {
    await prisma.billingInvoiceApproval.update({
      where: { id: pending.id },
      data: {
        decision,
        actorId: input.actorId,
        actorRole: String(input.actorRole),
        reason: input.reason,
        decidedAt: new Date(),
      },
    });
  } else {
    await prisma.billingInvoiceApproval.create({
      data: {
        invoiceId: input.invoiceId,
        approvalType: input.approvalType,
        decision,
        actorId: input.actorId,
        actorRole: String(input.actorRole),
        reason: input.reason,
        decidedAt: new Date(),
      },
    });
  }

  if (decision === "rejected" || decision === "changes_requested") {
    const { invoice } = await transitionInvoice({
      invoiceId: input.invoiceId,
      to: "draft",
      actorId: input.actorId,
      actorRole: input.actorRole,
      reason: input.reason ?? `Approval ${decision}`,
      organisationId: input.organisationId,
    });
    return invoice;
  }

  const invoice = await prisma.billingInvoice.findUniqueOrThrow({
    where: { id: input.invoiceId },
  });
  const from = normalizeLegacyStatus(invoice.status);

  let to: BillingInvoiceState = "approved";
  if (from === "participant_review") {
    // Prefer provider review next when provider approval still pending
    const providerPending = await prisma.billingInvoiceApproval.findFirst({
      where: {
        invoiceId: input.invoiceId,
        approvalType: "provider",
        decision: "pending",
      },
    });
    to = providerPending ? "provider_review" : "approved";
  } else if (from === "provider_review") {
    to = "approved";
  }

  const { invoice: updated } = await transitionInvoice({
    invoiceId: input.invoiceId,
    to,
    actorId: input.actorId,
    actorRole: input.actorRole,
    reason: input.reason ?? "Approved",
    organisationId: input.organisationId,
  });

  return updated;
}
