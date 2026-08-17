import {
  isStripeIntegrationEnabled,
  isStripeSdkAvailable,
  stripeConfig,
} from "@/lib/stripe/config";

export const phase2Config = {
  documentStorageMode: process.env.DOCUMENT_STORAGE_MODE ?? "local",
  documentMaxUploadMb: Number(process.env.DOCUMENT_MAX_UPLOAD_MB ?? "10"),
  billingDefaultCurrency: process.env.BILLING_DEFAULT_CURRENCY ?? "AUD",
  billingRequirePreflight: process.env.BILLING_REQUIRE_PREFLIGHT !== "false",
  billingEnableStripe: process.env.BILLING_ENABLE_STRIPE === "true",
  billingEnableXero: process.env.BILLING_ENABLE_XERO === "true",
  stripeSecretKey: stripeConfig.secretKey,
  stripeWebhookSecret: stripeConfig.webhookSecret,
  stripeDefaultCurrency: process.env.STRIPE_DEFAULT_CURRENCY ?? "AUD",
  xeroClientId: process.env.XERO_CLIENT_ID,
  xeroClientSecret: process.env.XERO_CLIENT_SECRET,
  xeroRedirectUri: process.env.XERO_REDIRECT_URI,
};

export function isStripeConfigured(): boolean {
  return isStripeIntegrationEnabled();
}

export { isStripeSdkAvailable };

export function isXeroConfigured(): boolean {
  return Boolean(
    phase2Config.billingEnableXero &&
      phase2Config.xeroClientId &&
      phase2Config.xeroClientSecret
  );
}
