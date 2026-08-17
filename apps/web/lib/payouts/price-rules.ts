import type { BillingFundingSourceType, BillingInvoiceLineType, BillingServiceType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type PriceRuleCheckInput = {
  lineItems: Array<{
    description: string;
    unitAmountCents: number;
    quantity: number;
    lineType?: BillingInvoiceLineType;
    ndisLineItemCode?: string;
  }>;
  bookingType: BillingServiceType;
  fundingSourceType: BillingFundingSourceType;
};

export type PriceRuleCheckResult = {
  pass: boolean;
  warnings: string[];
  reasons: string[];
  requiresAdminReview: boolean;
};

export function checkPriceRules(input: PriceRuleCheckInput): PriceRuleCheckResult {
  const warnings: string[] = [];
  const reasons: string[] = [];
  let requiresAdminReview = false;

  for (const line of input.lineItems) {
    if (line.unitAmountCents < 0) {
      reasons.push(`Line "${line.description}" has a negative amount.`);
    }
    if (line.unitAmountCents > 500_000) {
      warnings.push(`Line "${line.description}" exceeds $5,000 — may need review.`);
      requiresAdminReview = true;
    }
  }

  const isNdis =
    input.fundingSourceType === "ndis_plan_managed" ||
    input.fundingSourceType === "ndis_self_managed";

  if (isNdis) {
    const missingNdisCode = input.lineItems.some(
      (li) => !li.ndisLineItemCode && li.lineType !== "platform_fee"
    );
    if (missingNdisCode) {
      warnings.push(
        "One or more lines are missing an NDIS line item code. This does not guarantee claim approval."
      );
    }
  }

  const total = input.lineItems.reduce(
    (sum, li) => sum + li.unitAmountCents * li.quantity,
    0
  );
  if (total <= 0) {
    reasons.push("Total payable amount must be greater than zero.");
  }

  return {
    pass: reasons.length === 0,
    warnings,
    reasons,
    requiresAdminReview,
  };
}

export async function checkDuplicateActivePayment(bookingId: string) {
  const active = await prisma.billingInvoice.findFirst({
    where: {
      bookingId,
      status: { in: ["pending_payment", "issued", "paid"] },
      payoutStatus: { notIn: ["paid_out", "partially_paid_out"] },
    },
    include: { payments: true },
  });

  if (active?.payments.some((p) => p.status === "succeeded" || p.status === "processing")) {
    return {
      allowed: false,
      reason:
        "An active payment already exists for this booking. Contact support if you need to replace it.",
      existingInvoiceId: active.id,
    };
  }

  return { allowed: true as const };
}
