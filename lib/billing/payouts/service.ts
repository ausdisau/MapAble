import type {
  BillingCentreProviderPayout,
  MapAbleUserRole,
} from "@prisma/client";

import { writeFinancialAudit } from "@/lib/billing/audit/financial-audit";
import {
  allowPayoutWithoutPayment,
  isConnectPayoutsEnabled,
} from "@/lib/billing/config";
import { addCents, applyBps, type Cents } from "@/lib/billing/money";
import { prisma } from "@/lib/prisma";

export type CalculateProviderPayablesInput = {
  organisationId: string;
  periodStart: Date;
  periodEnd: Date;
  commissionBps?: number;
  /** When true, allow lines from unpaid/disputed invoices into review_required payouts. */
  allowUnpaidOrDisputed?: boolean;
  actorId?: string | null;
  actorRole?: MapAbleUserRole | string | null;
};

/**
 * Calculate provider payables from paid invoice lines.
 * Blocks unpaid/disputed invoices unless allowUnpaidOrDisputed policy flag is set
 * (those land in review_required with withheld amounts).
 */
export async function calculateProviderPayables(
  input: CalculateProviderPayablesInput
): Promise<BillingCentreProviderPayout> {
  const allowUnpaidOrDisputed =
    input.allowUnpaidOrDisputed ?? allowPayoutWithoutPayment();

  const invoices = await prisma.billingInvoice.findMany({
    where: {
      providerId: input.organisationId,
      issuedAt: { gte: input.periodStart, lte: input.periodEnd },
      status: {
        notIn: ["void", "cancelled", "written_off", "draft"],
      },
    },
    include: { lineItems: true },
  });

  let grossCents: Cents = 0;
  let withheldCents: Cents = 0;
  const remittanceLines: {
    invoiceId: string;
    invoiceNumber: string | null;
    amountCents: number;
    included: boolean;
    reason?: string;
  }[] = [];

  for (const invoice of invoices) {
    const lineSum = invoice.lineItems.reduce(
      (s, li) => addCents(s, li.totalCents),
      0
    );
    const isPaid = invoice.status === "paid";
    const isDisputed = invoice.status === "disputed";
    const isUnpaid =
      !isPaid &&
      ["issued", "sent", "pending_payment", "partially_paid", "overdue", "exported"].includes(
        invoice.status
      );

    if (isPaid) {
      grossCents = addCents(grossCents, lineSum);
      remittanceLines.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amountCents: lineSum,
        included: true,
      });
      continue;
    }

    if ((isUnpaid || isDisputed) && allowUnpaidOrDisputed) {
      withheldCents = addCents(withheldCents, lineSum);
      remittanceLines.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amountCents: lineSum,
        included: false,
        reason: isDisputed
          ? "Disputed — withheld pending policy review"
          : "Unpaid — withheld pending collection",
      });
      continue;
    }

    if (isUnpaid || isDisputed) {
      remittanceLines.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amountCents: lineSum,
        included: false,
        reason: isDisputed
          ? "Blocked: disputed invoice (policy does not allow)"
          : "Blocked: unpaid invoice (policy does not allow)",
      });
    }
  }

  const commissionBps = input.commissionBps ?? 0;
  const commissionCents = applyBps(grossCents, commissionBps);
  const netPayableCents = Math.max(
    0,
    grossCents - commissionCents - withheldCents
  );

  const needsReview =
    withheldCents > 0 ||
    remittanceLines.some((l) => !l.included && l.reason?.startsWith("Blocked"));

  const payout = await prisma.billingCentreProviderPayout.create({
    data: {
      organisationId: input.organisationId,
      status: needsReview ? "review_required" : "calculated",
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      grossCents,
      commissionCents,
      adjustmentsCents: 0,
      withheldCents,
      netPayableCents,
      remittanceJson: {
        lines: remittanceLines,
        allowUnpaidOrDisputed,
        commissionBps,
      },
    },
  });

  await writeFinancialAudit({
    organisationId: input.organisationId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "provider_payout_calculated",
    entityType: "BillingCentreProviderPayout",
    entityId: payout.id,
    newValues: {
      grossCents,
      commissionCents,
      withheldCents,
      netPayableCents,
      status: payout.status,
    },
  });

  return payout;
}

export type ApprovePayoutInput = {
  payoutId: string;
  actorId: string;
  actorRole?: MapAbleUserRole | string | null;
  reason?: string;
};

export async function approveProviderPayout(
  input: ApprovePayoutInput
): Promise<BillingCentreProviderPayout> {
  const payout = await prisma.billingCentreProviderPayout.findUnique({
    where: { id: input.payoutId },
  });
  if (!payout) {
    throw new Error(`Payout not found: ${input.payoutId}`);
  }
  if (payout.status !== "calculated" && payout.status !== "review_required") {
    throw new Error(`Cannot approve payout in status ${payout.status}`);
  }

  const updated = await prisma.billingCentreProviderPayout.update({
    where: { id: payout.id },
    data: {
      status: "approved",
      approvedById: input.actorId,
    },
  });

  await writeFinancialAudit({
    organisationId: payout.organisationId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "provider_payout_approved",
    entityType: "BillingCentreProviderPayout",
    entityId: payout.id,
    previousValues: { status: payout.status },
    newValues: { status: "approved" },
    reason: input.reason,
  });

  return updated;
}

export type ReleasePayoutInput = {
  payoutId: string;
  actorId: string;
  actorRole?: MapAbleUserRole | string | null;
  destinationRef?: string;
  reason?: string;
};

/**
 * Release an approved payout.
 * Live Stripe Connect transfers require MAPABLE_PAYOUTS_ENABLED=true + STRIPE_SECRET_KEY
 * after authenticated environment testing. Otherwise status moves to processing as simulated.
 */
export async function releaseProviderPayout(
  input: ReleasePayoutInput
): Promise<BillingCentreProviderPayout & { connectLive: boolean }> {
  const payout = await prisma.billingCentreProviderPayout.findUnique({
    where: { id: input.payoutId },
  });
  if (!payout) {
    throw new Error(`Payout not found: ${input.payoutId}`);
  }
  if (payout.status !== "approved" && payout.status !== "scheduled") {
    throw new Error(`Cannot release payout in status ${payout.status}`);
  }

  const connectLive = isConnectPayoutsEnabled();
  const destinationRef =
    input.destinationRef ??
    (connectLive ? "stripe_connect" : "simulated_destination");

  const updated = await prisma.billingCentreProviderPayout.update({
    where: { id: payout.id },
    data: {
      status: "processing",
      destinationRef,
      releasedAt: new Date(),
      remittanceJson: {
        ...((payout.remittanceJson as object) ?? {}),
        connectLive,
        releaseNote: connectLive
          ? "Connect payouts enabled — hand off to transfer pipeline after readiness checks."
          : "SIMULATED release. Enable MAPABLE_PAYOUTS_ENABLED only after authenticated environment testing.",
      },
    },
  });

  await writeFinancialAudit({
    organisationId: payout.organisationId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: connectLive
      ? "provider_payout_released_connect_enabled"
      : "provider_payout_released_simulated",
    entityType: "BillingCentreProviderPayout",
    entityId: payout.id,
    previousValues: { status: payout.status },
    newValues: {
      status: "processing",
      destinationRef,
      netPayableCents: payout.netPayableCents,
      connectLive,
    },
    reason: input.reason,
  });

  return { ...updated, connectLive };
}
