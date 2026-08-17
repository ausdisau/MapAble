import { connectRefreshUrl, connectReturnUrl } from "@/lib/payouts/config";
import { getStripeClient } from "@/lib/stripe/client";

export async function createExpressConnectAccount(params: {
  userId: string;
  role: string;
}) {
  const stripe = getStripeClient();
  return stripe.accounts.create({
    type: "express",
    country: "AU",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { mapableUserId: params.userId, mapableRole: params.role },
  });
}

/** Transfer-only recipient account (Express fallback — Accounts v2 when SDK supports). */
export async function createRecipientConnectAccount(params: {
  email: string;
  displayName: string;
  country?: string;
  metadata?: Record<string, string>;
}) {
  const stripe = getStripeClient();
  return stripe.accounts.create({
    type: "express",
    country: params.country ?? "AU",
    email: params.email,
    business_profile: { name: params.displayName },
    capabilities: {
      transfers: { requested: true },
    },
    controller: {
      stripe_dashboard: { type: "express" },
      fees: { payer: "application" },
      losses: { payments: "application" },
    },
    metadata: params.metadata,
  });
}

export async function createConnectOnboardingLink(stripeAccountId: string) {
  const stripe = getStripeClient();
  return stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: connectRefreshUrl(),
    return_url: connectReturnUrl(),
    type: "account_onboarding",
  });
}

export async function createConnectDashboardLink(stripeAccountId: string) {
  const stripe = getStripeClient();
  return stripe.accounts.createLoginLink(stripeAccountId);
}
