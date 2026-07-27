import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { hasParticipantAuthority } from "@/lib/authority/participant-authority-service";
import { abilityPayConfig } from "@/lib/config/abilitypay-home-living";
import { prisma } from "@/lib/prisma";

export type ReconciliationInput = {
  invoiceId: string;
  invoiceNumber?: string | null;
  invoicedTotalCents: number;
  expectedTotalCents?: number | null;
  serviceEvidencePresent: boolean;
  duplicateInvoiceId?: string;
};

export function reconcileInvoiceDeterministically(input: ReconciliationInput) {
  const differences: Array<{
    code: string;
    explanation: string;
    expectedCents?: number;
    observedCents?: number;
  }> = [];
  if (
    input.expectedTotalCents != null &&
    input.expectedTotalCents !== input.invoicedTotalCents
  ) {
    differences.push({
      code: "RATE_OR_QUANTITY_DIFFERS_FROM_EXPECTED_CONTEXT",
      explanation:
        "The invoiced total differs from the recorded expected cost.",
      expectedCents: input.expectedTotalCents,
      observedCents: input.invoicedTotalCents,
    });
  }
  if (!input.serviceEvidencePresent) {
    differences.push({
      code: "SERVICE_EVIDENCE_NOT_FOUND",
      explanation: "Confirmed service-delivery evidence was not found.",
    });
  }
  const duplicateIndicators = input.duplicateInvoiceId
    ? [
        {
          code: "POSSIBLE_DUPLICATE",
          relatedInvoiceId: input.duplicateInvoiceId,
        },
      ]
    : [];
  const missingEvidence = [
    ...(!input.serviceEvidencePresent ? ["service_delivery"] : []),
    ...(input.expectedTotalCents == null ? ["expected_cost_context"] : []),
  ];
  return {
    overallStatus:
      duplicateIndicators.length || differences.length
        ? ("participant_review" as const)
        : missingEvidence.length
          ? ("needs_information" as const)
          : ("matched" as const),
    lineResults: [],
    duplicateIndicators,
    differences,
    missingEvidence,
    uncertainty:
      input.expectedTotalCents == null
        ? [
            "Expected cost is unknown; no funding availability conclusion was made.",
          ]
        : [],
  };
}

export async function reconcileBillingInvoice(input: {
  invoiceId: string;
  actor: CurrentUser;
}) {
  if (!abilityPayConfig.enabled || !abilityPayConfig.reconciliationEnabled) {
    throw new Error("ABILITYPAY_RECONCILIATION_DISABLED");
  }
  const invoice = await prisma.billingInvoice.findUnique({
    where: { id: input.invoiceId },
    include: { lineItems: true, booking: true },
  });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");
  const canReviewSelf =
    invoice.userId === input.actor.id &&
    hasPermission(input.actor.primaryRole, "finance:review");
  const delegated = await hasParticipantAuthority({
    participantId: invoice.userId,
    actorUserId: input.actor.id,
    domain: "finance",
    action: "review_invoice",
    consentScopes: ["payments.invoices"],
  });
  if (!canReviewSelf && !delegated)
    throw new Error("FINANCIAL_AUTHORITY_DENIED");

  const expected = await prisma.expectedCostContext.findFirst({
    where: {
      participantId: invoice.userId,
      providerOrganisationId: invoice.providerId ?? undefined,
      ...(invoice.bookingId ? { bookingId: invoice.bookingId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  const duplicate = invoice.invoiceNumber
    ? await prisma.billingInvoice.findFirst({
        where: {
          id: { not: invoice.id },
          providerId: invoice.providerId,
          invoiceNumber: invoice.invoiceNumber,
        },
        select: { id: true },
      })
    : null;
  const reconciliation = reconcileInvoiceDeterministically({
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    invoicedTotalCents: invoice.totalCents,
    expectedTotalCents: expected?.expectedTotalCents,
    serviceEvidencePresent: Boolean(invoice.bookingId),
    duplicateInvoiceId: duplicate?.id,
  });
  const record = await prisma.invoiceReconciliationRecord.create({
    data: {
      invoiceId: invoice.id,
      expectedCostContextId: expected?.id,
      overallStatus: reconciliation.overallStatus,
      lineResults: reconciliation.lineResults as Prisma.InputJsonValue,
      duplicateIndicators:
        reconciliation.duplicateIndicators as Prisma.InputJsonValue,
      differences: reconciliation.differences as Prisma.InputJsonValue,
      missingEvidence: reconciliation.missingEvidence,
      uncertainty: reconciliation.uncertainty,
      policyVersion: "abilitypay-reconciliation-1.0.0",
    },
  });
  await createAuditEvent({
    actorUserId: input.actor.id,
    actorRole: input.actor.primaryRole,
    participantId: invoice.userId,
    organisationId: invoice.providerId,
    action: "abilitypay.invoice_reconciled",
    entityType: "BillingInvoice",
    entityId: invoice.id,
    metadata: {
      reconciliationId: record.id,
      status: reconciliation.overallStatus,
      differenceCodes: reconciliation.differences.map((item) => item.code),
    },
  });
  return { invoice, expected, reconciliation, recordId: record.id };
}

export async function recordParticipantInvoiceDecision(input: {
  invoiceId: string;
  actor: CurrentUser;
  decision:
    | "approve_for_processing"
    | "request_clarification"
    | "dispute"
    | "delegate_review"
    | "save_for_later";
  reason?: string;
}) {
  const invoice = await prisma.billingInvoice.findUnique({
    where: { id: input.invoiceId },
  });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");
  const permission: Permission =
    input.decision === "request_clarification"
      ? "finance:request_clarification"
      : input.decision === "dispute"
        ? "finance:dispute"
        : input.decision === "approve_for_processing"
          ? "finance:approve_for_processing"
          : "finance:review";
  if (
    invoice.userId !== input.actor.id ||
    !hasPermission(input.actor.primaryRole, permission)
  ) {
    throw new Error("FINANCIAL_AUTHORITY_DENIED");
  }
  return prisma.participantInvoiceDecision.create({
    data: {
      invoiceId: invoice.id,
      participantId: invoice.userId,
      actorUserId: input.actor.id,
      decision: input.decision,
      reason: input.reason,
    },
  });
}

export function preparePaymentInstruction() {
  if (!abilityPayConfig.paymentExecutionEnabled) {
    return {
      status: "preparation_only" as const,
      executable: false as const,
      reason:
        "Payment execution is disabled and requires authorised human review.",
    };
  }
  throw new Error("PAYMENT_EXECUTION_NOT_IMPLEMENTED");
}
