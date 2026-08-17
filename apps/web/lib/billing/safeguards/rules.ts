import type { BillingSafeguardAlert, MapAbleUserRole } from "@prisma/client";

import { writeFinancialAudit } from "@/lib/billing/audit/financial-audit";
import { prisma } from "@/lib/prisma";

export type SafeguardCheckContext = {
  organisationId?: string | null;
  invoiceId?: string;
  serviceRecordId?: string;
  actorId?: string | null;
  actorRole?: MapAbleUserRole | string | null;
};

const REVIEW = "review_required" as const;

/**
 * Run neutral safeguard checks. Language stays non-accusatory ("review required").
 * Persists BillingSafeguardAlert rows for anything that needs human attention.
 */
export async function runSafeguardChecks(
  ctx: SafeguardCheckContext
): Promise<BillingSafeguardAlert[]> {
  const alerts: BillingSafeguardAlert[] = [];

  if (ctx.invoiceId) {
    const invoice = await prisma.billingInvoice.findUnique({
      where: { id: ctx.invoiceId },
      include: {
        lineItems: true,
        approvals: true,
        serviceRecords: true,
      },
    });

    if (invoice) {
      // Duplicate support item + service date overlap
      const codes = invoice.lineItems
        .map((l) => l.ndisLineItem)
        .filter(Boolean) as string[];
      const uniqueCodes = new Set(codes);
      if (codes.length !== uniqueCodes.size) {
        alerts.push(
          await createAlert({
            organisationId: ctx.organisationId ?? invoice.providerId,
            entityType: "BillingInvoice",
            entityId: invoice.id,
            ruleCode: "duplicate_support_item_on_invoice",
            message:
              "Review required: the same support item appears more than once on this invoice.",
            metadata: { invoiceId: invoice.id },
          })
        );
      }

      // Rate above stored policy cap flag via validationStatus
      const overCap = invoice.lineItems.filter(
        (l) => l.validationStatus === "POLICY_REVIEW_REQUIRED"
      );
      if (overCap.length > 0) {
        alerts.push(
          await createAlert({
            organisationId: ctx.organisationId ?? invoice.providerId,
            entityType: "BillingInvoice",
            entityId: invoice.id,
            ruleCode: "rate_policy_review",
            message:
              "Review required: one or more lines need pricing policy confirmation before issue.",
            metadata: { lineIds: overCap.map((l) => l.id) },
          })
        );
      }

      // Same actor approving their own draft
      if (ctx.actorId) {
        const selfApproval = invoice.approvals.find(
          (a) =>
            a.actorId === ctx.actorId &&
            a.decision === "approved" &&
            a.approvalType === "provider"
        );
        // Check if actor also created transitions into draft/issue path
        const createdTransition = await prisma.billingInvoiceTransition.findFirst(
          {
            where: {
              invoiceId: invoice.id,
              actorId: ctx.actorId,
              priorState: "draft",
            },
          }
        );
        if (selfApproval && createdTransition) {
          alerts.push(
            await createAlert({
              organisationId: ctx.organisationId ?? invoice.providerId,
              entityType: "BillingInvoice",
              entityId: invoice.id,
              ruleCode: "same_actor_approve",
              message:
                "Review required: the same person prepared and approved this invoice. A second reviewer is recommended.",
              metadata: { actorId: ctx.actorId },
            })
          );
        }
      }

      // Zero or negative totals
      if (invoice.totalCents <= 0) {
        alerts.push(
          await createAlert({
            organisationId: ctx.organisationId ?? invoice.providerId,
            entityType: "BillingInvoice",
            entityId: invoice.id,
            ruleCode: "non_positive_total",
            message:
              "Review required: invoice total is not greater than zero.",
            metadata: { totalCents: invoice.totalCents },
          })
        );
      }
    }
  }

  if (ctx.serviceRecordId) {
    const record = await prisma.billingServiceRecord.findUnique({
      where: { id: ctx.serviceRecordId },
    });
    if (record) {
      // Overlapping open records for same participant/source window
      const overlaps = await prisma.billingServiceRecord.findMany({
        where: {
          id: { not: record.id },
          participantId: record.participantId,
          status: { notIn: ["cancelled"] },
          serviceStart: { lte: record.serviceEnd ?? record.serviceStart },
          OR: [
            { serviceEnd: null },
            { serviceEnd: { gte: record.serviceStart } },
          ],
          sourceType: record.sourceType,
        },
        take: 5,
      });
      if (overlaps.length > 0) {
        alerts.push(
          await createAlert({
            organisationId: ctx.organisationId ?? record.organisationId,
            entityType: "BillingServiceRecord",
            entityId: record.id,
            ruleCode: "overlapping_service_windows",
            message:
              "Review required: another service record may overlap this time window for the same participant.",
            metadata: { overlapIds: overlaps.map((o) => o.id) },
          })
        );
      }
    }
  }

  if (alerts.length > 0 && ctx.actorId) {
    await writeFinancialAudit({
      organisationId: ctx.organisationId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      action: "safeguard_checks_run",
      entityType: ctx.invoiceId
        ? "BillingInvoice"
        : ctx.serviceRecordId
          ? "BillingServiceRecord"
          : "BillingSafeguard",
      entityId: ctx.invoiceId ?? ctx.serviceRecordId ?? "batch",
      newValues: {
        alertCount: alerts.length,
        ruleCodes: alerts.map((a) => a.ruleCode),
      },
    });
  }

  return alerts;
}

async function createAlert(input: {
  organisationId?: string | null;
  entityType: string;
  entityId: string;
  ruleCode: string;
  message: string;
  metadata?: object;
}): Promise<BillingSafeguardAlert> {
  return prisma.billingSafeguardAlert.create({
    data: {
      organisationId: input.organisationId ?? undefined,
      entityType: input.entityType,
      entityId: input.entityId,
      ruleCode: input.ruleCode,
      severity: REVIEW,
      message: input.message,
      metadata: input.metadata,
    },
  });
}
