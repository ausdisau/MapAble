import { format } from "date-fns";

import { writeBillingAuditLog } from "@/lib/billing/core/audit";
import { prisma } from "@/lib/prisma";

export async function exportPaymentToCsv(paymentId: string) {
  const payment = await prisma.billingPayment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: { include: { lineItems: true, fundingSource: true } },
      splits: { include: { payoutRecipient: true } },
    },
  });
  if (!payment) return { ok: false as const, error: "Payment not found" };

  const header = [
    "paymentId",
    "bookingId",
    "invoiceNumber",
    "payerType",
    "fundingSourceType",
    "grossAmount",
    "platformFee",
    "recipientName",
    "recipientType",
    "netTransfer",
    "stripePaymentIntentId",
    "stripeChargeId",
    "stripeTransferId",
    "transferGroup",
    "status",
    "createdAt",
    "paidAt",
    "transferredAt",
  ].join(",");

  const rows = payment.splits.map((split) =>
    [
      payment.id,
      payment.invoice?.bookingId ?? "",
      payment.invoice?.invoiceNumber ?? "",
      payment.invoice?.payerType ?? "",
      payment.invoice?.fundingSourceType ?? payment.invoice?.fundingSource?.type ?? "",
      payment.amountCents,
      split.platformFeeCents,
      split.payoutRecipient?.displayName ?? "",
      split.recipientType,
      split.netTransferCents ?? split.amountCents,
      payment.stripePaymentIntentId ?? "",
      payment.stripeChargeId ?? "",
      split.transferId ?? "",
      payment.transferGroup ?? "",
      split.status,
      format(payment.createdAt, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      payment.paidAt ? format(payment.paidAt, "yyyy-MM-dd'T'HH:mm:ssXXX") : "",
      split.updatedAt ? format(split.updatedAt, "yyyy-MM-dd'T'HH:mm:ssXXX") : "",
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");

  const exportRecord = await prisma.accountingExport.create({
    data: {
      externalSystem: "csv",
      status: "exported",
      entityType: "BillingPayment",
      entityId: paymentId,
      exportedAt: new Date(),
      lines: {
        create: [{ lineData: { rowCount: rows.length } }],
      },
    },
  });

  await writeBillingAuditLog({
    entityType: "AccountingExport",
    entityId: exportRecord.id,
    action: "payment_csv_exported",
    after: { paymentId },
  });

  return { ok: true as const, csv, exportId: exportRecord.id };
}

export async function exportPayoutBatchToCsv(batchId: string) {
  const transfers = await prisma.payoutTransfer.findMany({
    where: { payoutBatchId: batchId },
    include: {
      payoutSplit: { include: { payment: { include: { invoice: true } } } },
      recipient: true,
    },
  });

  const header = [
    "batchId",
    "transferId",
    "stripeTransferId",
    "paymentId",
    "bookingId",
    "recipientName",
    "amountCents",
    "status",
    "transferGroup",
  ].join(",");

  const rows = transfers.map((t) =>
    [
      batchId,
      t.id,
      t.stripeTransferId ?? "",
      t.payoutSplit.paymentId,
      t.payoutSplit.payment.invoice?.bookingId ?? "",
      t.recipient.displayName,
      t.amountCents,
      t.status,
      t.transferGroup ?? "",
    ].join(",")
  );

  return { ok: true as const, csv: [header, ...rows].join("\n") };
}

export function buildXeroInvoicePayload(paymentId: string) {
  return {
    status: "not_implemented" as const,
    message: "Xero API not configured — placeholder payload only",
    paymentId,
    placeholder: true,
  };
}

export function buildXeroBillOrSpendMoneyPayload(batchId: string) {
  return {
    status: "not_implemented" as const,
    message: "Xero API not configured — placeholder payload only",
    batchId,
    placeholder: true,
  };
}
