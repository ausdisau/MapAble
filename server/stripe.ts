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
