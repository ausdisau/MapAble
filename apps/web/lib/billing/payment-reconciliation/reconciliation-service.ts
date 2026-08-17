import type { ReconciliationMatchStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  RECONCILIATION_AMOUNT_TOLERANCE_CENTS,
  y2OrchestrationConfig,
} from "@/lib/config/y2-orchestration";
import { prisma } from "@/lib/prisma";

function matchInvoiceToPayments(
  invoiceTotalCents: number,
  stripeAmountCents: number | null | undefined,
  hasXero: boolean
): { matchStatus: ReconciliationMatchStatus; reasonCode: string | null } {
  if (stripeAmountCents == null && !hasXero) {
    return { matchStatus: "unmatched", reasonCode: "NO_PAYMENT_OR_XERO" };
  }

  if (stripeAmountCents != null) {
    const diff = Math.abs(stripeAmountCents - invoiceTotalCents);
    if (diff <= RECONCILIATION_AMOUNT_TOLERANCE_CENTS && hasXero) {
      return { matchStatus: "matched", reasonCode: null };
    }
    if (diff <= RECONCILIATION_AMOUNT_TOLERANCE_CENTS && !hasXero) {
      return { matchStatus: "partial", reasonCode: "STRIPE_ONLY_NO_XERO" };
    }
    if (diff > RECONCILIATION_AMOUNT_TOLERANCE_CENTS) {
      return { matchStatus: "partial", reasonCode: "AMOUNT_MISMATCH" };
    }
  }

  if (hasXero && stripeAmountCents == null) {
    return { matchStatus: "partial", reasonCode: "XERO_ONLY_NO_STRIPE" };
  }

  return { matchStatus: "unmatched", reasonCode: "UNKNOWN" };
}

export async function createReconciliationBatch(
  periodStart: Date,
  periodEnd: Date,
  createdById: string,
  organisationId?: string
) {
  const useV2 = y2OrchestrationConfig.paymentReconciliationV2Enabled;

  const batch = await prisma.paymentReconciliationBatch.create({
    data: {
      periodStart,
      periodEnd,
      createdById,
      status: "pending",
      organisationId,
    },
  });

  const invoices = await prisma.invoice.findMany({
    where: {
      createdAt: { gte: periodStart, lte: periodEnd },
      ...(organisationId ? { organisationId } : {}),
    },
  });

  const stripePayments = await prisma.stripePaymentIntentRecord.findMany({
    where: { createdAt: { gte: periodStart, lte: periodEnd } },
  });

  const xeroSyncs = await prisma.xeroInvoiceSyncRecord.findMany({
    where: { createdAt: { gte: periodStart, lte: periodEnd } },
  });

  let matched = 0;
  let unmatched = 0;

  for (const inv of invoices) {
    const stripe = stripePayments.find((p) => p.invoiceId === inv.id);
    const xero = xeroSyncs.find((x) => x.invoiceId === inv.id);

    let matchStatus: ReconciliationMatchStatus = "unmatched";
    let reasonCode: string | null = null;

    if (useV2) {
      const result = matchInvoiceToPayments(
        inv.totalCents,
        stripe?.amountCents,
        Boolean(xero)
      );
      matchStatus = result.matchStatus;
      reasonCode = result.reasonCode;
    } else {
      if (stripe && xero) matchStatus = "matched";
      else if (stripe || xero) matchStatus = "partial";
    }

    if (matchStatus === "matched") matched++;
    else unmatched++;

    await prisma.paymentReconciliationException.create({
      data: {
        batchId: batch.id,
        invoiceId: inv.id,
        stripePaymentId: stripe?.stripePaymentIntentId,
        xeroInvoiceId: xero?.xeroInvoiceId ?? undefined,
        matchStatus,
        reasonCode: reasonCode ?? undefined,
        organisationId: inv.organisationId ?? organisationId,
        amountCents: stripe?.amountCents ?? inv.totalCents,
        workflowState: matchStatus === "matched" ? "resolved" : "open",
        notes:
          matchStatus === "unmatched"
            ? reasonCode ?? "No Stripe or Xero link found — requires review"
            : reasonCode ?? undefined,
      },
    });
  }

  for (const p of stripePayments.filter((s) => !s.invoiceId)) {
    unmatched++;
    await prisma.paymentReconciliationException.create({
      data: {
        batchId: batch.id,
        stripePaymentId: p.stripePaymentIntentId,
        matchStatus: "unmatched",
        reasonCode: "ORPHAN_STRIPE_PAYMENT",
        amountCents: p.amountCents,
        workflowState: "open",
        notes: "Stripe payment without MapAble invoice",
      },
    });
  }

  const total = matched + unmatched;
  const unpaidPercent = total > 0 ? (unmatched / total) * 100 : 0;

  const summaryJson = {
    matched,
    unmatched,
    totalExceptions: total,
    unpaidPercent,
    killCriteriaBreached: unpaidPercent > 2,
    v2: useV2,
  };

  await prisma.paymentReconciliationBatch.update({
    where: { id: batch.id },
    data: { summaryJson, status: "completed" },
  });

  await createAuditEvent({
    actorUserId: createdById,
    action: "reconciliation.batch_created",
    entityType: "PaymentReconciliationBatch",
    entityId: batch.id,
    metadata: summaryJson,
  });

  if (useV2 && summaryJson.killCriteriaBreached) {
    await createAuditEvent({
      actorUserId: createdById,
      action: "reconciliation.kill_criteria_warning",
      entityType: "PaymentReconciliationBatch",
      entityId: batch.id,
      metadata: { unpaidPercent },
    });
  }

  return prisma.paymentReconciliationBatch.findUnique({
    where: { id: batch.id },
    include: { exceptions: true },
  });
}

export async function updateExceptionWorkflow(params: {
  exceptionId: string;
  workflowState: "open" | "investigating" | "resolved" | "written_off";
  assigneeId?: string;
  notes?: string;
  actorUserId: string;
}) {
  const ex = await prisma.paymentReconciliationException.update({
    where: { id: params.exceptionId },
    data: {
      workflowState: params.workflowState,
      assigneeId: params.assigneeId,
      notes: params.notes,
      matchStatus:
        params.workflowState === "resolved" || params.workflowState === "written_off"
          ? "reviewed"
          : undefined,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "reconciliation.exception_updated",
    entityType: "PaymentReconciliationException",
    entityId: params.exceptionId,
    metadata: { workflowState: params.workflowState },
  });

  return ex;
}

export async function markExceptionReviewed(
  exceptionId: string,
  actorUserId: string
) {
  return updateExceptionWorkflow({
    exceptionId,
    workflowState: "resolved",
    actorUserId,
    notes: "Reviewed by admin",
  });
}

export async function getReconciliationDashboard(organisationId?: string) {
  const batches = await prisma.paymentReconciliationBatch.findMany({
    where: organisationId ? { organisationId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { exceptions: true },
  });

  const latest = batches[0];
  const summary = latest?.summaryJson as
    | {
        unpaidPercent?: number;
        killCriteriaBreached?: boolean;
        matched?: number;
        unmatched?: number;
      }
    | null;

  return {
    batches,
    metrics: summary ?? null,
  };
}

export async function runScheduledReconciliationBatch(actorUserId: string) {
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 86400000);
  return createReconciliationBatch(start, end, actorUserId);
}
