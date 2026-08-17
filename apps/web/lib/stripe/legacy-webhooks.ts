import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { legacyInvoiceIdFromMetadata } from "@/lib/stripe/metadata";

export async function storeLegacyWebhookEventIdempotent(
  stripeEventId: string,
  eventType: string,
  payload: object
): Promise<{ duplicate: boolean }> {
  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { stripeEventId },
  });
  if (existing?.processedAt) {
    return { duplicate: true };
  }

  await prisma.stripeWebhookEvent.upsert({
    where: { stripeEventId },
    create: {
      stripeEventId,
      eventType,
      payload,
      processedAt: null,
    },
    update: { eventType, payload },
  });

  return { duplicate: false };
}

export async function markLegacyWebhookProcessed(stripeEventId: string) {
  await prisma.stripeWebhookEvent.update({
    where: { stripeEventId },
    data: { processedAt: new Date() },
  });
}

export async function handleLegacyStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleLegacyCheckoutCompleted(session);
      break;
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleLegacyCheckoutFailed(session);
      break;
    }
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await handleLegacyPaymentIntentSucceeded(pi);
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await handleLegacyPaymentIntentFailed(pi);
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      await handleLegacyChargeRefunded(charge);
      break;
    }
    default:
      break;
  }
}

async function handleLegacyCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.metadata?.invoiceId) return;

  const invoiceId = legacyInvoiceIdFromMetadata(session.metadata);
  if (!invoiceId) return;

  await prisma.stripeCheckoutSessionRecord.updateMany({
    where: { stripeSessionId: session.id },
    data: { status: "complete" },
  });

  const piId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (piId) {
    await prisma.stripePaymentIntentRecord.updateMany({
      where: { invoiceId },
      data: { stripePaymentIntentId: piId, status: "succeeded" },
    });
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "paid" },
  });
}

async function handleLegacyCheckoutFailed(session: Stripe.Checkout.Session) {
  const invoiceId = legacyInvoiceIdFromMetadata(session.metadata);
  if (!invoiceId) return;

  await prisma.stripeCheckoutSessionRecord.updateMany({
    where: { stripeSessionId: session.id },
    data: { status: "failed" },
  });
}

async function handleLegacyPaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const invoiceId = legacyInvoiceIdFromMetadata(pi.metadata);
  if (!invoiceId) return;

  await prisma.stripePaymentIntentRecord.updateMany({
    where: { stripePaymentIntentId: pi.id },
    data: { status: "succeeded" },
  });

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "paid" },
  });
}

async function handleLegacyPaymentIntentFailed(pi: Stripe.PaymentIntent) {
  const invoiceId = legacyInvoiceIdFromMetadata(pi.metadata);
  if (!invoiceId) return;

  await prisma.stripePaymentIntentRecord.updateMany({
    where: { stripePaymentIntentId: pi.id },
    data: {
      status: "failed",
    },
  });
}

async function handleLegacyChargeRefunded(charge: Stripe.Charge) {
  const piId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!piId) return;

  const record = await prisma.stripePaymentIntentRecord.findFirst({
    where: { stripePaymentIntentId: piId },
  });
  if (!record) return;

  await prisma.stripePaymentIntentRecord.update({
    where: { id: record.id },
    data: { status: "refunded" },
  });
}
