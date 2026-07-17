import type { BillingPaymentSplitRecipient } from "@prisma/client";

import { writeBillingAuditLog } from "@/lib/billing-core/audit";
import {
  calculateGstCents,
  calculateInvoiceTotals,
  calculatePlatformFeeCents,
} from "@/lib/billing-core/calculations";
import { createDraftInvoice } from "@/lib/billing-core/invoice-service";
import { payoutPolicyDefaults } from "@/lib/payouts/config";
import { transferGroupForBooking } from "@/lib/payouts/payout-policy";
import { checkDuplicateActivePayment } from "@/lib/payouts/price-rules";
import { calculatePayoutSplits } from "@/lib/payouts/split-calculator";
import type { CreateBookingPaymentInput } from "@/lib/payouts/types";
import { prisma } from "@/lib/prisma";

export async function createBookingPayment(input: CreateBookingPaymentInput) {
  const duplicateCheck = await checkDuplicateActivePayment(input.bookingId);
  if (!duplicateCheck.allowed) {
    throw new Error(duplicateCheck.reason ?? "Duplicate payment not allowed.");
  }

  const transferGroup = transferGroupForBooking(input.bookingId);
  const lineItemsForCalc = input.lineItems.map((li) => ({
    quantity: li.quantity,
    unitAmountCents: li.unitAmountCents,
    gstApplicable: li.gstApplicable ?? false,
  }));
  const totals = calculateInvoiceTotals(lineItemsForCalc);
  const platformFeeCents = payoutPolicyDefaults.zeroFeePilotMode
    ? 0
    : calculatePlatformFeeCents(totals.subtotalCents);

  const invoice = await createDraftInvoice(input.userId, {
    providerId: input.providerId,
    bookingId: input.bookingId,
    serviceType: input.bookingType,
    fundingSourceId: input.fundingSourceId,
    lineItems: input.lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitAmountCents: li.unitAmountCents,
      ndisLineItem: li.ndisLineItem,
      gstApplicable: li.gstApplicable,
      metadata: {
        lineType: li.lineType,
        recipientId: li.recipientId,
        serviceCategory: li.serviceCategory,
      },
    })),
  });

  await prisma.billingInvoice.update({
    where: { id: invoice.id },
    data: {
      transferGroup,
      payerType: input.payerType,
      fundingSourceType: input.fundingSourceType,
      invoiceNumber: `MAP-${invoice.id.slice(-8).toUpperCase()}`,
      platformFeeCents,
      gstCents: calculateGstCents(lineItemsForCalc),
      subtotalCents: totals.subtotalCents,
      totalCents: totals.totalCents + platformFeeCents,
      payoutStatus: "none",
    },
  });

  for (const li of input.lineItems) {
    await prisma.billingInvoiceLineItem.updateMany({
      where: { invoiceId: invoice.id, description: li.description },
      data: {
        lineType: li.lineType,
        recipientId: li.recipientId,
        serviceCategory: li.serviceCategory,
      },
    });
  }

  const splitResult = calculatePayoutSplits({
    bookingType: input.bookingType,
    grossAmountCents: totals.totalCents + platformFeeCents,
    lineItems: input.lineItems.map((li) => ({
      description: li.description,
      lineType: li.lineType,
      recipientId: li.recipientId,
      totalAmountCents: li.quantity * li.unitAmountCents,
    })),
    recipients: (input.recipientSplits ?? []).map((s) => ({
      recipientType:
        s.recipientType === "worker"
          ? "support_worker"
          : s.recipientType === "provider"
            ? "provider_org"
            : s.recipientType === "transport_operator"
              ? "transport_operator"
              : "other",
      recipientId: s.recipientId,
    })),
    fundingSourceType: input.fundingSourceType,
    serviceCompletionStatus: "pending",
  });

  if (splitResult.validationErrors.length > 0) {
    throw new Error(splitResult.validationErrors.join(" "));
  }

  const method =
    input.fundingSourceType === "ndis_plan_managed"
      ? "external_plan_manager"
      : input.fundingSourceType === "organisation_invoice"
        ? "manual"
        : "stripe_checkout";

  const payment = await prisma.billingPayment.create({
    data: {
      invoiceId: invoice.id,
      userId: input.userId,
      providerId: input.providerId,
      status: "requires_payment",
      method,
      amountCents: totals.totalCents + platformFeeCents,
      currency: input.currency ?? "AUD",
      transferGroup,
      netDistributableCents: splitResult.totalNetTransferCents,
      payoutStatus: "none",
      splits: {
        create: splitResult.splits
          .filter((s) => s.role !== "mapable_platform")
          .map((s) => ({
            recipientType: s.recipientType as BillingPaymentSplitRecipient,
            recipientId: s.recipientId,
            payoutRecipientId: s.payoutRecipientId,
            amountCents: s.netTransferCents,
            grossShareCents: s.grossShareCents,
            platformFeeCents: s.platformFeeCents,
            adjustmentsCents: s.adjustmentsCents,
            reserveCents: s.reserveCents,
            netTransferCents: s.netTransferCents,
            status: "pending_service",
            idempotencyKey: `split:${invoice.id}:${s.role}:${s.recipientId ?? "platform"}`,
          })),
      },
    },
    include: { splits: true },
  });

  await writeBillingAuditLog({
    actorUserId: input.userId,
    entityType: "BillingPayment",
    entityId: payment.id,
    action: "booking_payment_created",
    after: {
      bookingId: input.bookingId,
      transferGroup,
      splitCount: payment.splits.length,
    },
  });

  return { invoice, payment, transferGroup, splitResult };
}

export async function markExternalPaymentReceived(
  paymentId: string,
  actorUserId: string
) {
  const payment = await prisma.billingPayment.update({
    where: { id: paymentId },
    data: {
      status: "succeeded",
      payoutStatus: "paid_pending_service",
      externalPaymentMarkedAt: new Date(),
      paidAt: new Date(),
    },
  });
  await prisma.billingInvoice.update({
    where: { id: payment.invoiceId },
    data: {
      status: "paid",
      payoutStatus: "paid_pending_service",
      paidAt: new Date(),
    },
  });
  await writeBillingAuditLog({
    actorUserId,
    entityType: "BillingPayment",
    entityId: paymentId,
    action: "external_payment_marked",
  });
  return payment;
}
