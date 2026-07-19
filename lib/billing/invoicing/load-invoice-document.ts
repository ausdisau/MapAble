import type { CurrentUser } from "@/lib/auth/current-user";
import { assertCanViewBillingInvoice } from "@/lib/billing/access";
import type { InvoiceDocumentModel } from "@/lib/billing/invoicing/invoice-document";
import { prisma } from "@/lib/prisma";

export async function loadInvoiceDocumentForUser(
  user: CurrentUser,
  invoiceId: string
): Promise<InvoiceDocumentModel> {
  await assertCanViewBillingInvoice(user, invoiceId);

  const invoice = await prisma.billingInvoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: {
      lineItems: { orderBy: { createdAt: "asc" } },
      fundingSource: true,
      provider: true,
      user: true,
    },
  });

  return {
    invoiceNumber: invoice.invoiceNumber ?? `DRAFT-${invoice.id.slice(0, 8)}`,
    status: invoice.status,
    issueDate: invoice.issuedAt,
    dueDate: invoice.dueAt,
    currency: invoice.currency,
    legalEntityName: "MapAble Australia",
    tradingName: "MapAble",
    abn: invoice.provider?.abn ?? null,
    providerName: invoice.provider?.name ?? null,
    recipientName: invoice.user.name,
    participantDisplayRef: invoice.participantDisplayRef,
    fundingLabel: invoice.fundingSource?.label ?? invoice.fundingSourceType,
    servicePeriodStart: invoice.servicePeriodStart,
    servicePeriodEnd: invoice.servicePeriodEnd,
    lines: invoice.lineItems.map((li) => ({
      description: li.description,
      serviceDate: li.serviceDate,
      supportItemCode: li.ndisLineItem,
      quantity: Number(li.quantity),
      unit: li.unit,
      unitAmountCents: li.unitAmountCents,
      gstCents: li.gstCents,
      totalCents: li.totalCents,
    })),
    subtotalCents: invoice.subtotalCents,
    platformFeeCents: invoice.platformFeeCents,
    gstCents: invoice.gstCents,
    coPaymentCents: invoice.coPaymentCents,
    creditCents: invoice.creditCents,
    totalCents: invoice.totalCents,
    amountPaidCents: invoice.amountPaidCents,
    notesForBilling: invoice.notesForBilling,
  };
}
