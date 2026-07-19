import type { BillingFundingSourceType } from "@prisma/client";

export type CheckoutDecision =
  | { allowed: true; method: "stripe_checkout" }
  | {
      allowed: false;
      reason: "plan_managed";
      instruction: string;
      exportFormats: ("csv" | "plan_manager")[];
    }
  | { allowed: false; reason: "unsupported"; instruction: string };

export function checkoutDecisionForFundingType(
  type: BillingFundingSourceType | null | undefined
): CheckoutDecision {
  if (!type) {
    return {
      allowed: false,
      reason: "unsupported",
      instruction: "Select a funding source before paying.",
    };
  }

  if (type === "ndis_plan_managed") {
    return {
      allowed: false,
      reason: "plan_managed",
      instruction:
        "This invoice is plan-managed. Export or send it to your plan manager instead of paying by card.",
      exportFormats: ["csv", "plan_manager"],
    };
  }

  // private_pay is checkout-compatible with private_card (card / self-pay).
  if (
    type === "ndis_self_managed" ||
    type === "private_card" ||
    type === "private_pay"
  ) {
    return { allowed: true, method: "stripe_checkout" };
  }

  if (type === "organisation_invoice" || type === "grant") {
    return {
      allowed: false,
      reason: "unsupported",
      instruction:
        "This funding type uses invoice export or organisation billing, not card checkout.",
    };
  }

  return {
    allowed: false,
    reason: "unsupported",
    instruction: "Card checkout is not available for this funding source.",
  };
}

export function stripeCheckoutAllowed(
  type: BillingFundingSourceType | null | undefined
): boolean {
  const decision = checkoutDecisionForFundingType(type);
  return decision.allowed;
}
