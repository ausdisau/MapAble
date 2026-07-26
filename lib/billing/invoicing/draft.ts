import type {
  BillingInvoice,
  BillingServiceType,
  MapAbleUserRole,
} from "@prisma/client";

import { writeFinancialAudit } from "@/lib/billing/audit/financial-audit";
import {
  generateChargeLinesFromServiceRecord,
  toPrismaLineType,
  type FundingSplitWeights,
  type VerticalSplitConfig,
} from "@/lib/billing/calculations/charge";
import { invoiceTotals, multiplyCents } from "@/lib/billing/money";
import { validateChargeLinesAgainstPolicy } from "@/lib/billing/policy/validate";
import { billingCoreConfig } from "@/lib/billing/core/config";
import { prisma } from "@/lib/prisma";

export type CreateDraftFromServiceRecordsInput = {
  participantId: string;
  serviceRecordIds: string[];
  providerId?: string | null;
  fundingSourceId?: string | null;
  actorId: string;
  actorRole: MapAbleUserRole | string;
  organisationId?: string | null;
  dueAt?: Date;
  fundingSplit?: FundingSplitWeights;
  verticalSplit?: VerticalSplitConfig;
  platformFeeBps?: number;
  gstBps?: number;
  notesForBilling?: string;
};

/**
 * Create a draft invoice from locked service records.
 * Sets POLICY_REVIEW_REQUIRED (policy_review_required) when policy validation fails.
 */
export async function createDraftFromServiceRecords(
  input: CreateDraftFromServiceRecordsInput
): Promise<{
  invoice: BillingInvoice;
  policyReviewRequired: boolean;
  messages: string[];
}> {
  if (input.serviceRecordIds.length === 0) {
    throw new Error("At least one locked service record is required");
  }

  const records = await prisma.billingServiceRecord.findMany({
    where: {
      id: { in: input.serviceRecordIds },
      participantId: input.participantId,
    },
  });

  if (records.length !== input.serviceRecordIds.length) {
    throw new Error("One or more service records were not found for participant");
  }

  for (const record of records) {
    if (record.status !== "locked" && record.status !== "charged") {
      throw new Error(
        `Service record ${record.id} must be locked before draft invoice creation (status=${record.status})`
      );
    }
    if (record.invoiceId) {
      throw new Error(
        `Service record ${record.id} is already linked to invoice ${record.invoiceId}`
      );
    }
  }

  const allLines = [];
  const messages: string[] = [];
  let policyReviewRequired = false;
  let policyVersionId: string | undefined;
  let serviceType: BillingServiceType = records[0]!.serviceType;
  let periodStart = records[0]!.serviceStart;
  let periodEnd = records[0]!.serviceEnd ?? records[0]!.serviceStart;

  for (const record of records) {
    const generated = await generateChargeLinesFromServiceRecord({
      serviceRecord: record,
      fundingSplit: input.fundingSplit,
      verticalSplit: input.verticalSplit,
      organisationId: input.organisationId ?? record.organisationId,
    });
    allLines.push(...generated.lines);
    if (generated.policyReviewRequired) {
      policyReviewRequired = true;
      messages.push(...generated.messages);
    }
    policyVersionId = policyVersionId ?? generated.policyVersionId;
    if (record.serviceStart < periodStart) periodStart = record.serviceStart;
    const end = record.serviceEnd ?? record.serviceStart;
    if (end > periodEnd) periodEnd = end;
    serviceType = record.serviceType;
  }

  const policyResult = await validateChargeLinesAgainstPolicy({
    lines: allLines,
    organisationId: input.organisationId,
    asOf: periodStart,
  });

  if (!policyResult.ok) {
    if (policyResult.status === "FAILED") {
      throw new Error(policyResult.messages.join(" "));
    }
    policyReviewRequired = true;
    messages.push(...policyResult.messages);
  }
  policyVersionId = policyVersionId ?? policyResult.policyVersionId;

  const calcLines = allLines.map((l) => ({
    quantity: l.quantity,
    unitAmountCents: l.unitRateCents,
    gstApplicable: l.gstApplicable,
  }));

  const totals = invoiceTotals({
    lines: calcLines,
    platformFeeBps: input.platformFeeBps ?? billingCoreConfig.platformFeeBps,
    gstBps: input.gstBps ?? billingCoreConfig.gstBps,
  });

  const status = policyReviewRequired ? "policy_review_required" : "draft";

  const invoice = await prisma.billingInvoice.create({
    data: {
      userId: input.participantId,
      providerId: input.providerId ?? records[0]?.organisationId ?? undefined,
      serviceType,
      status,
      fundingSourceId: input.fundingSourceId ?? undefined,
      subtotalCents: totals.subtotalCents,
      platformFeeCents: totals.platformFeeCents,
      gstCents: totals.gstCents,
      totalCents: totals.totalPayableCents,
      coPaymentCents: totals.coPaymentCents,
      discountCents: totals.discountCents,
      creditCents: totals.creditCents,
      servicePeriodStart: periodStart,
      servicePeriodEnd: periodEnd,
      dueAt: input.dueAt,
      policyVersionId,
      notesForBilling: input.notesForBilling,
      ndisClaimable: allLines.some((l) => Boolean(l.supportItemCode)),
      lineItems: {
        create: allLines.map((l) => {
          const lineTotal = multiplyCents(l.unitRateCents, l.quantity);
          return {
            description: l.description,
            quantity: l.quantity,
            unitAmountCents: l.unitRateCents,
            totalCents: lineTotal,
            ndisLineItem: l.supportItemCode,
            gstApplicable: l.gstApplicable,
            lineType: toPrismaLineType(l.lineType),
            unit: l.unit,
            policyVersionId: l.policyVersionId ?? policyVersionId,
            serviceRecordId: l.serviceRecordId,
            recipientId: l.workerOrProviderId,
            fundedCents: l.fundingAllocation?.fundedCents ?? lineTotal,
            coPaymentCents: l.fundingAllocation?.coPaymentCents ?? 0,
            privateCents: l.fundingAllocation?.privateCents ?? 0,
            validationStatus: policyReviewRequired
              ? "POLICY_REVIEW_REQUIRED"
              : "ok",
            metadata: {
              chargeLineType: l.lineType,
              employerCents: l.fundingAllocation?.employerCents ?? 0,
            },
          };
        }),
      },
    },
    include: { lineItems: true },
  });

  await prisma.billingServiceRecord.updateMany({
    where: { id: { in: input.serviceRecordIds } },
    data: {
      status: "invoiced",
      invoiceId: invoice.id,
      chargeSnapshot: {
        lineCount: allLines.length,
        totalCents: totals.totalPayableCents,
        policyVersionId,
        policyReviewRequired,
      },
    },
  });

  await writeFinancialAudit({
    organisationId: input.organisationId ?? invoice.providerId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "draft_invoice_from_service_records",
    entityType: "BillingInvoice",
    entityId: invoice.id,
    participantId: input.participantId,
    newValues: {
      status: invoice.status,
      totalCents: invoice.totalCents,
      serviceRecordIds: input.serviceRecordIds,
      policyReviewRequired,
    },
    policyVersionId,
  });

  return { invoice, policyReviewRequired, messages };
}
