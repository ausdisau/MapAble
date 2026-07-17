/**
 * Billing Centre runtime configuration.
 * Live plan-manager delivery and Stripe Connect payouts stay off until
 * explicitly enabled in an authenticated environment.
 */

export type ClaimsGatewayMode =
  | "mock"
  | "csv_export"
  | "plan_manager"
  | "official_disabled";

export function billingPlatformFeeBps(): number {
  const raw = Number(process.env.BILLING_PLATFORM_FEE_BPS ?? "1000");
  return Number.isFinite(raw) ? Math.trunc(raw) : 1000;
}

export function billingGstBps(): number {
  const raw = Number(process.env.BILLING_GST_BPS ?? "1000");
  return Number.isFinite(raw) ? Math.trunc(raw) : 1000;
}

export function billingClaimsGatewayDefault(): ClaimsGatewayMode {
  const value = process.env.BILLING_CLAIMS_GATEWAY ?? "mock";
  if (
    value === "mock" ||
    value === "csv_export" ||
    value === "plan_manager" ||
    value === "official_disabled"
  ) {
    return value;
  }
  return "mock";
}

/** Permit unpaid/disputed invoices into payout calculation (review_required). */
export function allowPayoutWithoutPayment(): boolean {
  return process.env.BILLING_ALLOW_PAYOUT_WITHOUT_PAYMENT === "true";
}

/** Official NDIA API — always off unless credentials + explicit flag. */
export function isNdiaOfficialEnabled(): boolean {
  return (
    process.env.BILLING_NDIA_OFFICIAL_ENABLED === "true" &&
    Boolean(process.env.NDIA_API_CLIENT_ID && process.env.NDIA_API_CLIENT_SECRET)
  );
}

/**
 * Live plan-manager transmission (email/API). Requires authenticated env:
 * flag + plan-manager delivery endpoint or SMTP/SendGrid.
 * Without this, plan-manager packs remain simulated/export-only.
 */
export function isPlanManagerLiveDeliveryEnabled(): boolean {
  if (process.env.BILLING_PLAN_MANAGER_LIVE !== "true") return false;
  const hasDeliveryTarget = Boolean(
    process.env.BILLING_PLAN_MANAGER_WEBHOOK_URL ||
      process.env.SENDGRID_API_KEY ||
      process.env.BILLING_PLAN_MANAGER_API_KEY
  );
  return hasDeliveryTarget;
}

/** Stripe Connect payout transfers — must be explicitly enabled. */
export function isConnectPayoutsEnabled(): boolean {
  return (
    process.env.MAPABLE_PAYOUTS_ENABLED === "true" &&
    Boolean(process.env.STRIPE_SECRET_KEY)
  );
}

export function isBillingCopilotEnabled(): boolean {
  return process.env.BILLING_COPILOT_ENABLED !== "false";
}

export function describeIntegrationReadiness(): {
  planManagerLive: boolean;
  connectPayouts: boolean;
  ndiaOfficial: boolean;
  notes: string[];
} {
  const notes: string[] = [];
  const planManagerLive = isPlanManagerLiveDeliveryEnabled();
  const connectPayouts = isConnectPayoutsEnabled();
  const ndiaOfficial = isNdiaOfficialEnabled();

  if (!planManagerLive) {
    notes.push(
      "Plan-manager delivery is simulated/export-only until BILLING_PLAN_MANAGER_LIVE=true and a delivery credential is configured."
    );
  }
  if (!connectPayouts) {
    notes.push(
      "Stripe Connect payouts are disabled until MAPABLE_PAYOUTS_ENABLED=true and STRIPE_SECRET_KEY are set in an authenticated environment."
    );
  }
  if (!ndiaOfficial) {
    notes.push("Official NDIA claiming remains disabled.");
  }

  return { planManagerLive, connectPayouts, ndiaOfficial, notes };
}
