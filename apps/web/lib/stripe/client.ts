import Stripe from "stripe";

import { isStripeSdkAvailable, stripeConfig } from "@/lib/stripe/config";
import { StripeNotConfiguredError } from "@/lib/stripe/errors";

/** Pinned Stripe API version for MapAble Core billing. */
export const STRIPE_API_VERSION = "2026-05-27.dahlia" as const;

type StripeClientOptions = NonNullable<ConstructorParameters<typeof Stripe>[1]>;

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!isStripeSdkAvailable()) {
    throw new StripeNotConfiguredError();
  }
  if (!stripeClient) {
    stripeClient = new Stripe(stripeConfig.secretKey!, {
      apiVersion: STRIPE_API_VERSION as StripeClientOptions["apiVersion"],
      typescript: true,
      appInfo: {
        name: "MapAble Core",
        url: "https://mapable.com.au",
      },
    });
  }
  return stripeClient;
}

export function resetStripeClientForTests() {
  stripeClient = null;
}
