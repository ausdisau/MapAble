import {
  isStripeSdkAvailable,
  priceIdForSubscriptionPlan,
  stripeConfig,
} from "@/lib/stripe/config";

export const billingCoreConfig = {
  appUrl: stripeConfig.appUrl,
  stripeSecretKey: stripeConfig.secretKey,
  stripeWebhookSecret: stripeConfig.webhookSecret,
  stripeConnectClientId: stripeConfig.connectClientId,
  providerProPriceId: stripeConfig.providerProPriceId,
  employerProPriceId: stripeConfig.employerProPriceId,
  defaultCurrency: stripeConfig.defaultCurrency.toUpperCase(),
  platformFeeBps: Number(process.env.BILLING_PLATFORM_FEE_BPS ?? "1000"),
  gstBps: Number(process.env.BILLING_GST_BPS ?? "1000"),
};

export const isBillingStripeConfigured = isStripeSdkAvailable;

export function priceIdForPlan(
  planCode: "provider_pro" | "employer_pro" | "marketplace_featured" | "other"
): string | null {
  return priceIdForSubscriptionPlan(planCode);
}
