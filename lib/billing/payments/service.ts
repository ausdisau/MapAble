import type { BillingPayment, MapAbleUserRole } from "@prisma/client";

import { writeFinancialAudit } from "@/lib/billing/audit/financial-audit";
import { transitionInvoice } from "@/lib/billing/invoicing/issue";
import { normalizeLegacyStatus } from "@/lib/billing/invoicing/state-machine";
import { addCents, subtractCents, type Cents } from "@/lib/billing/money";
import { prisma } from "@/lib/prisma";
import type { BillingInvoiceState } from "@/types/billing";

export type RecordManualPaymentInput = {
  invoiceId: string;
  amountCents: Cents;
  actorId: string;
  actorRole: MapAbleUserRole | string;
  organisationId?: string | null;
  currency?: string;
  externalReference?: string;
  paidAt?: Date;
  reason?: string;
};

function assertCents(amountCents: number, label: string): asserts amountCents is Cents {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error(`${label} must be a positive integer (cents)`);
  }
}

/**
 * Record a manual (non-Stripe) payment and allocate to the invoice.
 * Updates invoice status via the state machine using integer cents only.
 */
export async function recordManualPayment(
  input: RecordManualPaymentInput
): Promise<{ payment: BillingPayment; invoiceStatus: BillingInvoiceState }> {
  assertCents(input.amountCents, "amountCents");

  const invoice = await prisma.billingInvoice.findUnique({
    where: { id: input.invoiceId },
  });
  if (!invoice) {
    throw new Error(`Invoice not found: ${input.invoiceId}`);
  }

  const from = normalizeLegacyStatus(invoice.status);
  const payableStates: BillingInvoiceState[] = [
    "issued",
    "sent",
    "pending_payment",
    "partially_paid",
    "overdue",
    "exported",
  ];
  if (!payableStates.includes(from)) {
    throw new Error(
      `Cannot record payment against invoice in status ${from}`
    );
  }

  const previousPaid = invoice.amountPaidCents;
  const newPaid = addCents(previousPaid, input.amountCents);
  const remaining = subtractCents(invoice.totalCents, newPaid);

  const payment = await prisma.billingPayment.create({
    data: {
      invoiceId: invoice.id,
      userId: invoice.userId,
      providerId: invoice.providerId ?? undefined,
      status: "succeeded",
      method: "manual",
      amountCents: input.amountCents,
      currency: input.currency ?? invoice.currency,
      paidAt: input.paidAt ?? new Date(),
      externalPaymentMarkedAt: new Date(),
    },
  });

  await prisma.paymentAllocation.create({
    data: {
      invoiceId: invoice.id,
      amountCents: input.amountCents,
      source: input.externalReference
        ? `manual:${input.externalReference}`
        : `manual:${payment.id}`,
    },
  });

  await prisma.billingInvoice.update({
    where: { id: invoice.id },
    data: {
      amountPaidCents: newPaid,
      ...(remaining <= 0 ? { paidAt: input.paidAt ?? new Date() } : {}),
    },
  });

  let to: BillingInvoiceState;
  if (remaining <= 0) {
    to = "paid";
  } else {
    to = "partially_paid";
  }

  // Ensure we can transition: sent/issued/pending_payment → partially_paid/paid
  if (from === "issued") {
    await transitionInvoice({
      invoiceId: invoice.id,
      to: "sent",
      actorId: input.actorId,
      actorRole: input.actorRole,
      reason: "Marked sent for payment allocation",
      organisationId: input.organisationId,
    });
  }

  const current = await prisma.billingInvoice.findUniqueOrThrow({
    where: { id: invoice.id },
  });
  const currentStatus = normalizeLegacyStatus(current.status);

  if (currentStatus !== to) {
    // pending_payment and overdue can go directly to paid/partially_paid
    if (
      currentStatus === "sent" ||
      currentStatus === "pending_payment" ||
      currentStatus === "partially_paid" ||
      currentStatus === "overdue" ||
      currentStatus === "exported"
    ) {
      await transitionInvoice({
        invoiceId: invoice.id,
        to,
        actorId: input.actorId,
        actorRole: input.actorRole,
        reason: input.reason ?? "Manual payment recorded",
        organisationId: input.organisationId,
      });
    }
  }

  await writeFinancialAudit({
    organisationId: input.organisationId ?? invoice.providerId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "manual_payment_recorded",
    entityType: "BillingPayment",
    entityId: payment.id,
    participantId: invoice.userId,
    previousValues: { amountPaidCents: previousPaid },
    newValues: {
      amountCents: input.amountCents,
      amountPaidCents: newPaid,
      invoiceStatus: to,
    },
    reason: input.reason,
  });

  return { payment, invoiceStatus: to };
}

export type AllocatePaymentInput = {
  invoiceId: string;
  amountCents: Cents;
  source: string;
  actorId: string;
  actorRole?: MapAbleUserRole | string | null;
  organisationId?: string | null;
};

export async function allocatePaymentToInvoice(input: AllocatePaymentInput) {
  assertCents(input.amountCents, "amountCents");

  const allocation = await prisma.paymentAllocation.create({
    data: {
      invoiceId: input.invoiceId,
      amountCents: input.amountCents,
      source: input.source,
    },
  });

  await writeFinancialAudit({
    organisationId: input.organisationId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "payment_allocated",
    entityType: "PaymentAllocation",
    entityId: allocation.id,
    newValues: {
      invoiceId: input.invoiceId,
      amountCents: input.amountCents,
      source: input.source,
    },
  });

  return allocation;
}

export type RefundPaymentStubInput = {
  paymentId: string;
  amountCents: Cents;
  actorId: string;
  actorRole: MapAbleUserRole | string;
  reason: string;
  organisationId?: string | null;
};

/**
 * Stub refund — records intent and marks payment refunded.
 * Does not call Stripe; live refunds go through the Stripe path separately.
 */
export async function refundPaymentStub(
  input: RefundPaymentStubInput
): Promise<BillingPayment> {
  assertCents(input.amountCents, "amountCents");

  const payment = await prisma.billingPayment.findUnique({
    where: { id: input.paymentId },
    include: { invoice: true },
  });
  if (!payment) {
    throw new Error(`Payment not found: ${input.paymentId}`);
  }
  if (input.amountCents > payment.amountCents) {
    throw new Error("Refund amount cannot exceed original payment");
  }

  const updated = await prisma.billingPayment.update({
    where: { id: payment.id },
    data: { status: "refunded" },
  });

  const invoice = payment.invoice;
  const newPaid = Math.max(
    0,
    subtractCents(invoice.amountPaidCents, input.amountCents)
  );
  await prisma.billingInvoice.update({
    where: { id: invoice.id },
    data: { amountPaidCents: newPaid },
  });

  const from = normalizeLegacyStatus(invoice.status);
  if (from === "paid" || from === "partially_paid") {
    await transitionInvoice({
      invoiceId: invoice.id,
      to: "refunded",
      actorId: input.actorId,
      actorRole: input.actorRole,
      reason: input.reason,
      organisationId: input.organisationId,
    });
  }

  await writeFinancialAudit({
    organisationId: input.organisationId ?? invoice.providerId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "payment_refund_stub",
    entityType: "BillingPayment",
    entityId: payment.id,
    participantId: invoice.userId,
    previousValues: { status: payment.status, amountPaidCents: invoice.amountPaidCents },
    newValues: {
      status: "refunded",
      refundCents: input.amountCents,
      simulated: true,
    },
    reason: input.reason,
  });

  return updated;
}
