/**
 * Unified Stripe configuration for MapAble Core.
 * Set STRIPE_SECRET_KEY (and STRIPE_WEBHOOK_SECRET for webhooks).
 * Legacy routes also honour BILLING_ENABLE_STRIPE or STRIPE_ENABLED.
 */
export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  connectClientId: process.env.STRIPE_CONNECT_CLIENT_ID,
  providerProPriceId: process.env.STRIPE_PROVIDER_PRO_PRICE_ID,
  employerProPriceId: process.env.STRIPE_EMPLOYER_PRO_PRICE_ID,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  defaultCurrency: (process.env.STRIPE_DEFAULT_CURRENCY ?? "AUD").toLowerCase(),
};

/** True when the secret key is present (billing-core and SDK calls). */
export function isStripeSdkAvailable(): boolean {
  return Boolean(stripeConfig.secretKey);
}

/** Legacy phase-2/5 gate: requires env flag plus secret key. */
export function isStripeIntegrationEnabled(): boolean {
  if (!stripeConfig.secretKey) return false;
  return (
    process.env.BILLING_ENABLE_STRIPE === "true" ||
    process.env.STRIPE_ENABLED === "true"
  );
}

export function stripeNotConfiguredResponse() {
  return {
    configured: false,
    message: "Payments not configured. Set STRIPE_SECRET_KEY and enable BILLING_ENABLE_STRIPE or STRIPE_ENABLED.",
  };
}

export function priceIdForSubscriptionPlan(
  planCode: "provider_pro" | "employer_pro" | "marketplace_featured" | "other"
): string | null {
  switch (planCode) {
    case "provider_pro":
      return stripeConfig.providerProPriceId ?? null;
    case "employer_pro":
      return stripeConfig.employerProPriceId ?? null;
    default:
      return null;
  }
}
