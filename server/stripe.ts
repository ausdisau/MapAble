import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY not set – Stripe features will be unavailable");
}

export const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export function stripeEnabled(): boolean {
  return stripe !== null;
}

export function getStripe(): Stripe {
  if (!stripe) throw new Error("Stripe is not configured");
  return stripe;
}

function flagOn(v: string | undefined): boolean {
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function becsEnabled(): boolean {
  if (!stripeEnabled()) return false;
  if (flagOn(process.env.STRIPE_BECS_DISABLED)) return false;
  return true;
}

export function connectEnabled(): boolean {
  if (!stripeEnabled()) return false;
  return flagOn(process.env.STRIPE_CONNECT_ENABLED);
}

export function getPlatformFeeBps(): number {
  const v = Number(process.env.STRIPE_PLATFORM_FEE_BPS || "500");
  return isNaN(v) ? 500 : v;
}

export function calculatePlatformFee(amountCents: number): number {
  const bps = getPlatformFeeBps();
  return Math.round((amountCents * bps) / 10000);
}

export function getStripeCapabilities() {
  return {
    enabled: stripeEnabled(),
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
    capabilities: {
      card: stripeEnabled(),
      link: stripeEnabled(),
      becs: becsEnabled(),
      connect: connectEnabled(),
      autoDebit: becsEnabled(),
    },
    platformFeeBps: getPlatformFeeBps(),
  };
}
