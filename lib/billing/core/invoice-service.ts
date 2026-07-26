import type { BillingInvoiceStatus } from "@prisma/client";
import type { z } from "zod";

import { writeBillingAuditLog } from "@/lib/billing/core/audit";
import { calculateInvoiceTotals } from "@/lib/billing/core/calculations";
import type { createInvoiceSchema } from "@/lib/billing/core/schemas";
import { prisma } from "@/lib/prisma";

type CreateInput = z.infer<typeof createInvoiceSchema>;

export async function createDraftInvoice(userId: string, input: CreateInput) {
  const calcItems = input.lineItems.map((li) => ({
    quantity: li.quantity,
    unitAmountCents: li.unitAmountCents,
    gstApplicable: li.gstApplicable,
  }));
  const totals = calculateInvoiceTotals(calcItems);

  const invoice = await prisma.billingInvoice.create({
    data: {
      userId,
      providerId: input.providerId,
      bookingId: input.bookingId,
      serviceType: input.serviceType,
      status: "draft",
      fundingSourceId: input.fundingSourceId,
      subtotalCents: totals.subtotalCents,
      platformFeeCents: totals.platformFeeCents,
      gstCents: totals.gstCents,
      totalCents: totals.totalCents,
      ndisLineItem: input.ndisLineItem,
      ndisClaimable: input.ndisClaimable ?? false,
      dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
      lineItems: {
        create: input.lineItems.map((li) => {
          const totalCents = Math.round(li.quantity * li.unitAmountCents);
          return {
            description: li.description,
            quantity: li.quantity,
            unitAmountCents: li.unitAmountCents,
            totalCents,
            ndisLineItem: li.ndisLineItem,
            gstApplicable: li.gstApplicable ?? false,
            metadata: li.metadata as object | undefined,
          };
        }),
      },
    },
    include: { lineItems: true, fundingSource: true },
  });

  if (input.providerSplits?.length) {
    const payment = await prisma.billingPayment.create({
      data: {
        invoiceId: invoice.id,
        userId,
        providerId: input.providerId,
        status: "requires_payment",
        method: "stripe_connect",
        amountCents: invoice.totalCents,
        currency: invoice.currency,
        splits: {
          create: input.providerSplits.map((s) => ({
            recipientType: s.recipientType,
            recipientId: s.recipientId,
            amountCents: s.amountCents,
            status: "pending",
          })),
        },
      },
    });
    await writeBillingAuditLog({
      actorUserId: userId,
      entityType: "BillingPayment",
      entityId: payment.id,
      action: "splits_stub_created",
      after: { splitCount: input.providerSplits.length },
    });
  }

  await writeBillingAuditLog({
    actorUserId: userId,
    entityType: "BillingInvoice",
    entityId: invoice.id,
    action: "draft_created",
    after: { status: invoice.status, totalCents: invoice.totalCents },
  });

  return invoice;
}

export async function getInvoiceForUser(invoiceId: string, userId: string) {
  return prisma.billingInvoice.findFirst({
    where: { id: invoiceId, userId },
    include: {
      lineItems: true,
      fundingSource: true,
      payments: { include: { splits: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function listInvoicesForUser(userId: string) {
  return prisma.billingInvoice.findMany({
    where: { userId },
    include: { fundingSource: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: BillingInvoiceStatus,
  extra?: {
    paidAt?: Date;
    stripeCheckoutSessionId?: string;
    stripePaymentIntentId?: string;
    planManagerExportStatus?: string;
    xeroExportStatus?: string;
  },
  actorUserId?: string
) {
  const before = await prisma.billingInvoice.findUnique({
    where: { id: invoiceId },
  });
  const updated = await prisma.billingInvoice.update({
    where: { id: invoiceId },
    data: { status, ...extra },
  });
  await writeBillingAuditLog({
    actorUserId,
    entityType: "BillingInvoice",
    entityId: invoiceId,
    action: "status_updated",
    before: before ? { status: before.status } : undefined,
    after: { status: updated.status, ...extra },
  });
  return updated;
}

export async function adminSearchInvoices(filters: {
  userId?: string;
  providerId?: string;
  status?: BillingInvoiceStatus;
  from?: Date;
  to?: Date;
}) {
  return prisma.billingInvoice.findMany({
    where: {
      userId: filters.userId,
      providerId: filters.providerId,
      status: filters.status,
      createdAt: {
        gte: filters.from,
        lte: filters.to,
      },
    },
    include: {
      fundingSource: true,
      payments: { orderBy: { createdAt: "desc" }, take: 3 },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
