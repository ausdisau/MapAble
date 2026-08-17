import type Stripe from "stripe";

import {
  isStripeIntegrationEnabled,
  stripeNotConfiguredResponse,
} from "@/lib/stripe/config";
import { createPaymentIntentForLegacyInvoice } from "@/lib/stripe/payment-intents";
import {
  dispatchStripeWebhook,
  parseAndProcessWebhookRequest,
} from "@/lib/stripe/webhooks";

export { stripeNotConfiguredResponse, parseAndProcessWebhookRequest, dispatchStripeWebhook };

/** @deprecated Use createPaymentIntentForLegacyInvoice */
export async function createPaymentIntentPlaceholder(params: {
  invoiceId: string;
  amountCents: number;
  userId: string;
}) {
  if (!isStripeIntegrationEnabled()) {
    return { ok: false as const, ...stripeNotConfiguredResponse() };
  }

  return createPaymentIntentForLegacyInvoice({
    invoiceId: params.invoiceId,
    amountCents: params.amountCents,
    userId: params.userId,
  });
}

/** @deprecated Use dispatchStripeWebhook with a verified Stripe.Event */
export async function processStripeWebhookEvent(
  stripeEventId: string,
  eventType: string,
  payload: unknown
) {
  const event = {
    ...(payload as object),
    id: stripeEventId,
    type: eventType,
  } as Stripe.Event;

  const result = await dispatchStripeWebhook(event);
  return {
    duplicate: result.billing.duplicate || result.legacy.duplicate,
  };
}
