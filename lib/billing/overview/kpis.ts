import { prisma } from "@/lib/prisma";
import type { BillingOverviewKpis } from "@/types/billing";

export type ComputeBillingOverviewKpisInput = {
  organisationId?: string | null;
  participantId?: string | null;
  asOf?: Date;
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

async function sumInvoiceCents(where: {
  status?: { in: string[] } | string;
  providerId?: string;
  userId?: string;
  issuedAt?: { gte: Date };
}): Promise<number> {
  const result = await prisma.billingInvoice.aggregate({
    where: where as object,
    _sum: { totalCents: true },
  });
  return result._sum.totalCents ?? 0;
}

/**
 * Compute BillingOverviewKpis from Prisma aggregates.
 */
export async function computeBillingOverviewKpis(
  input: ComputeBillingOverviewKpisInput = {}
): Promise<BillingOverviewKpis> {
  const asOf = input.asOf ?? new Date();
  const monthStart = startOfMonth(asOf);
  const scope = {
    ...(input.organisationId ? { providerId: input.organisationId } : {}),
    ...(input.participantId ? { userId: input.participantId } : {}),
  };

  const [
    draftInvoiceCents,
    readyToIssueCents,
    issuedThisMonthCents,
    cashCollectedAgg,
    overdueCents,
    disputedCents,
    unbilledAgg,
    unreconciledSuggested,
    claimBatches,
    paidWithDates,
    payoutsDue,
    subscriptionAgg,
    revenueByVerticalRaw,
  ] = await Promise.all([
    sumInvoiceCents({ ...scope, status: "draft" }),
    sumInvoiceCents({
      ...scope,
      status: { in: ["approved", "ready_to_issue"] },
    }),
    sumInvoiceCents({
      ...scope,
      status: { in: ["issued", "sent", "pending_payment", "partially_paid", "paid", "overdue", "exported"] },
      issuedAt: { gte: monthStart },
    }),
    prisma.billingPayment.aggregate({
      where: {
        status: "succeeded",
        paidAt: { gte: monthStart },
        ...(input.organisationId ? { providerId: input.organisationId } : {}),
        ...(input.participantId ? { userId: input.participantId } : {}),
      },
      _sum: { amountCents: true },
    }),
    sumInvoiceCents({ ...scope, status: "overdue" }),
    sumInvoiceCents({ ...scope, status: "disputed" }),
    prisma.billingServiceRecord.aggregate({
      where: {
        invoiceId: null,
        status: { in: ["locked", "charged"] },
        ...(input.organisationId
          ? { organisationId: input.organisationId }
          : {}),
        ...(input.participantId ? { participantId: input.participantId } : {}),
      },
      _sum: { estimatedCents: true },
    }),
    prisma.billingReconciliationMatch.aggregate({
      where: {
        status: "suggested",
        ...(input.organisationId
          ? { session: { organisationId: input.organisationId } }
          : {}),
      },
      _sum: { amountCents: true },
    }),
    prisma.billingClaimBatch.findMany({
      where: {
        ...(input.organisationId
          ? { organisationId: input.organisationId }
          : {}),
      },
      select: { status: true },
      take: 500,
    }),
    prisma.billingInvoice.findMany({
      where: {
        ...scope,
        status: "paid",
        issuedAt: { not: null },
        paidAt: { not: null },
      },
      select: { issuedAt: true, paidAt: true },
      take: 500,
    }),
    prisma.billingCentreProviderPayout.aggregate({
      where: {
        status: { in: ["calculated", "review_required", "approved", "scheduled"] },
        ...(input.organisationId
          ? { organisationId: input.organisationId }
          : {}),
      },
      _sum: { netPayableCents: true },
    }),
    prisma.billingInvoice.aggregate({
      where: {
        ...scope,
        serviceType: "subscription",
        status: { in: ["paid", "issued", "sent", "partially_paid"] },
      },
      _sum: { totalCents: true },
    }),
    prisma.billingInvoice.groupBy({
      by: ["serviceType"],
      where: {
        ...scope,
        status: {
          in: [
            "issued",
            "sent",
            "pending_payment",
            "partially_paid",
            "paid",
            "overdue",
            "exported",
          ],
        },
      },
      _sum: { totalCents: true },
    }),
  ]);

  const rejected = claimBatches.filter((b) =>
    ["REJECTED", "ADJUSTMENT_REQUIRED"].includes(b.status)
  ).length;
  const submitted = claimBatches.filter((b) =>
    ["SUBMITTED", "ACCEPTED", "PARTIALLY_ACCEPTED", "REJECTED", "PAID"].includes(
      b.status
    )
  ).length;
  const claimRejectionRateBps =
    submitted === 0 ? 0 : Math.round((rejected / submitted) * 10_000);

  let averageDaysToPayment: number | null = null;
  if (paidWithDates.length > 0) {
    const totalDays = paidWithDates.reduce((sum, inv) => {
      if (!inv.issuedAt || !inv.paidAt) return sum;
      const days =
        (inv.paidAt.getTime() - inv.issuedAt.getTime()) /
        (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    averageDaysToPayment = Math.round(totalDays / paidWithDates.length);
  }

  return {
    draftInvoiceCents,
    readyToIssueCents,
    issuedThisMonthCents,
    cashCollectedCents: cashCollectedAgg._sum.amountCents ?? 0,
    overdueCents,
    disputedCents,
    unbilledCompletedServicesCents: unbilledAgg._sum.estimatedCents ?? 0,
    unreconciledPaymentsCents: unreconciledSuggested._sum.amountCents ?? 0,
    claimRejectionRateBps,
    averageDaysToPayment,
    providerPayoutsDueCents: payoutsDue._sum.netPayableCents ?? 0,
    subscriptionRevenueCents: subscriptionAgg._sum.totalCents ?? 0,
    revenueByVertical: revenueByVerticalRaw.map((row) => ({
      vertical: row.serviceType,
      cents: row._sum.totalCents ?? 0,
    })),
  };
}
