import { format } from "date-fns";

import { writeBillingAuditLog } from "@/lib/billing/core/audit";
import { assertInvoiceApprovedForExport } from "@/lib/billing/core/transparent-billing";
import { prisma } from "@/lib/prisma";

export async function exportInvoice(
  userId: string,
  invoiceId: string,
  formatType: "csv" | "xero" | "plan_manager"
) {
  const invoice = await prisma.billingInvoice.findFirst({
    where: { id: invoiceId, userId },
    include: { lineItems: true, fundingSource: true },
  });
  if (!invoice) return { ok: false as const, error: "Invoice not found" };

  try {
    assertInvoiceApprovedForExport(invoice);
  } catch {
    return {
      ok: false as const,
      error: "Invoice must be approved before export",
    };
  }

  if (formatType === "xero") {
    return {
      ok: true as const,
      format: "xero",
      status: "not_implemented",
      message: "Xero export scaffold — configure Xero integration to enable.",
    };
  }

  if (formatType === "csv") {
    const rows = [
      [
        "invoice_id",
        "service_type",
        "status",
        "currency",
        "subtotal_cents",
        "gst_cents",
        "platform_fee_cents",
        "total_cents",
        "ndis_line_item",
        "due_at",
      ].join(","),
      [
        invoice.id,
        invoice.serviceType,
        invoice.status,
        invoice.currency,
        invoice.subtotalCents,
        invoice.gstCents,
        invoice.platformFeeCents,
        invoice.totalCents,
        invoice.ndisLineItem ?? "",
        invoice.dueAt ? format(invoice.dueAt, "yyyy-MM-dd") : "",
      ].join(","),
      "line_description,quantity,unit_amount_cents,total_cents,ndis_line_item,gst_applicable",
      ...invoice.lineItems.map((li) =>
        [
          `"${li.description.replace(/"/g, '""')}"`,
          li.quantity.toString(),
          li.unitAmountCents,
          li.totalCents,
          li.ndisLineItem ?? "",
          li.gstApplicable,
        ].join(",")
      ),
    ].join("\n");

    await prisma.billingInvoice.update({
      where: { id: invoiceId },
      data: { status: "exported", xeroExportStatus: "csv_generated" },
    });

    await writeBillingAuditLog({
      actorUserId: userId,
      entityType: "BillingInvoice",
      entityId: invoiceId,
      action: "exported_csv",
    });

    return { ok: true as const, format: "csv", content: rows, mimeType: "text/csv" };
  }

  const planManagerPayload = {
    invoiceId: invoice.id,
    participantUserId: invoice.userId,
    planManager: {
      name: invoice.fundingSource?.planManagerName,
      email: invoice.fundingSource?.planManagerEmail,
    },
    ndisParticipantNumber: invoice.fundingSource?.ndisParticipantNumber,
    currency: invoice.currency,
    totalCents: invoice.totalCents,
    dueAt: invoice.dueAt?.toISOString() ?? null,
    lineItems: invoice.lineItems.map((li) => ({
      description: li.description,
      quantity: Number(li.quantity),
      unitAmountCents: li.unitAmountCents,
      totalCents: li.totalCents,
      ndisLineItem: li.ndisLineItem,
    })),
    emailSubject: `NDIS invoice ${invoice.id.slice(0, 8)} — ${invoice.totalCents / 100} ${invoice.currency}`,
    emailBody:
      "Please find the attached plan-managed invoice details for payment processing.",
  };

  await prisma.billingInvoice.update({
    where: { id: invoiceId },
    data: {
      planManagerExportStatus: "ready",
      status: invoice.status === "paid" ? invoice.status : "exported",
    },
  });

  await writeBillingAuditLog({
    actorUserId: userId,
    entityType: "BillingInvoice",
    entityId: invoiceId,
    action: "exported_plan_manager",
    after: planManagerPayload,
  });

  return {
    ok: true as const,
    format: "plan_manager",
    payload: planManagerPayload,
  };
}
