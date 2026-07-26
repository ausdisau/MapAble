import type Stripe from "stripe";

import {
  ensureStripeCustomer,
  updateConnectAccount,
} from "@/lib/billing/core/account-service";
import { writeBillingAuditLog } from "@/lib/billing/core/audit";
import { updateInvoiceStatus } from "@/lib/billing/core/invoice-service";
import { handleDispute, handleRefund } from "@/lib/payouts/block-service";
import { paymentsMode } from "@/lib/payouts/config";
import { syncRecipientFromStripeAccount } from "@/lib/payouts/recipient-service";
import { prisma } from "@/lib/prisma";

export async function storeWebhookEventIdempotent(
  stripeEventId: string,
  type: string,
  payload: object
): Promise<{ duplicate: boolean; eventRowId: string }> {
  const existing = await prisma.billingStripeWebhookEvent.findUnique({
    where: { stripeEventId },
  });
  if (existing?.processed) {
    return { duplicate: true, eventRowId: existing.id };
  }

  const row = await prisma.billingStripeWebhookEvent.upsert({
    where: { stripeEventId },
    create: {
      stripeEventId,
      type,
      payload,
      processed: false,
    },
    update: { type, payload },
  });

  return { duplicate: false, eventRowId: row.id };
}

export async function markWebhookProcessed(eventRowId: string) {
  await prisma.billingStripeWebhookEvent.update({
    where: { id: eventRowId },
    data: { processed: true, processedAt: new Date() },
  });
}

export async function handleStripeBillingEvent(event: Stripe.Event) {
  assertLivemodeMatches(event);

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await handleCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session
      );
      break;
    case "checkout.session.async_payment_failed":
      await handleCheckoutFailed(event.data.object as Stripe.Checkout.Session);
      break;
    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(
        event.data.object as Stripe.PaymentIntent
      );
      break;
    case "payment_intent.payment_failed":
      await handlePaymentIntentFailed(
        event.data.object as Stripe.PaymentIntent
      );
      break;
    case "charge.refunded":
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      break;
    case "charge.dispute.created":
      await handleDisputeCreated(event.data.object as Stripe.Dispute);
      break;
    case "invoice.paid":
    case "invoice.payment_failed":
      await handleStripeInvoiceEvent(event.data.object as Stripe.Invoice);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscriptionEvent(
        event.data.object as Stripe.Subscription,
        event.type
      );
      break;
    case "account.updated":
      await handleAccountUpdated(event.data.object as Stripe.Account);
      break;
    case "account.external_account.updated":
      await handleExternalAccountUpdated(event.data.object as Stripe.ExternalAccount);
      break;
    case "transfer.created":
      await handleTransferCreated(event.data.object as Stripe.Transfer);
      break;
    case "transfer.reversed":
      await handleTransferReversed(event.data.object as Stripe.Transfer);
      break;
    case "payout.paid":
    case "payout.failed":
    case "payout.created":
    case "payout.updated":
      await handleConnectedPayoutEvent(
        event.data.object as Stripe.Payout,
        event.type
      );
      break;
    default:
      break;
  }
}

function assertLivemodeMatches(event: Stripe.Event) {
  const expectedLive = paymentsMode() === "live";
  if (event.livemode !== expectedLive) {
    console.warn(
      `[stripe-webhook] livemode mismatch: event=${event.livemode} env=${paymentsMode()} id=${event.id}`
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const invoiceId = session.metadata?.invoiceId;
  const userId = session.metadata?.userId ?? session.metadata?.mapableUserId;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (session.mode === "subscription" && userId && session.subscription) {
    const subId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id;
    await prisma.billingSubscription.updateMany({
      where: { userId, status: "incomplete" },
      data: {
        stripeSubscriptionId: subId,
        status: "active",
      },
    });
    await writeBillingAuditLog({
      actorUserId: userId,
      entityType: "BillingSubscription",
      entityId: subId,
      action: "checkout_completed",
    });
    return;
  }

  if (!invoiceId) return;

  await prisma.billingPayment.updateMany({
    where: { stripeCheckoutSessionId: session.id },
    data: {
      status: "succeeded",
      stripePaymentIntentId: paymentIntentId ?? undefined,
      paidAt: new Date(),
      payoutStatus: "paid_pending_service",
    },
  });

  await prisma.billingInvoice.update({
    where: { id: invoiceId },
    data: { payoutStatus: "paid_pending_service" },
  });

  await updateInvoiceStatus(
    invoiceId,
    "paid",
    {
      paidAt: new Date(),
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId ?? undefined,
    },
    userId
  );

  await writeBillingAuditLog({
    actorUserId: userId,
    entityType: "BillingInvoice",
    entityId: invoiceId,
    action: "paid_via_checkout",
    after: { sessionId: session.id, paymentIntentId },
  });
}

async function handleCheckoutFailed(session: Stripe.Checkout.Session) {
  const invoiceId = session.metadata?.invoiceId;
  if (!invoiceId) return;
  await prisma.billingPayment.updateMany({
    where: { stripeCheckoutSessionId: session.id },
    data: { status: "failed", failureReason: "async_payment_failed" },
  });
  await updateInvoiceStatus(invoiceId, "failed");
}

async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const invoiceId = pi.metadata?.invoiceId;
  if (!invoiceId) {
    await prisma.billingPayment.updateMany({
      where: { stripePaymentIntentId: pi.id },
      data: { status: "succeeded", paidAt: new Date() },
    });
    return;
  }
  await prisma.billingPayment.updateMany({
    where: { invoiceId },
    data: {
      status: "succeeded",
      stripePaymentIntentId: pi.id,
      paidAt: new Date(),
    },
  });
  await updateInvoiceStatus(invoiceId, "paid", {
    paidAt: new Date(),
    stripePaymentIntentId: pi.id,
  });
}

async function handlePaymentIntentFailed(pi: Stripe.PaymentIntent) {
  const invoiceId = pi.metadata?.invoiceId;
  const reason = pi.last_payment_error?.message ?? "payment_failed";
  if (invoiceId) {
    await updateInvoiceStatus(invoiceId, "failed");
  }
  await prisma.billingPayment.updateMany({
    where: { stripePaymentIntentId: pi.id },
    data: { status: "failed", failureReason: reason },
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const piId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!piId) return;
  await prisma.billingPayment.updateMany({
    where: { stripePaymentIntentId: piId },
    data: { status: "refunded", stripeChargeId: charge.id },
  });
  const payment = await prisma.billingPayment.findFirst({
    where: { stripePaymentIntentId: piId },
  });
  if (payment) {
    await updateInvoiceStatus(payment.invoiceId, "refunded");
    const refundAmount = charge.amount_refunded ?? payment.amountCents;
    await handleRefund(payment.id, refundAmount);
  }
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const chargeId =
    typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
  if (!chargeId) return;
  await prisma.billingPayment.updateMany({
    where: { stripeChargeId: chargeId },
    data: { status: "disputed" },
  });
  const payment = await prisma.billingPayment.findFirst({
    where: { stripeChargeId: chargeId },
  });
  if (payment) {
    await handleDispute(payment.id);
  }
}

async function handleStripeInvoiceEvent(invoice: Stripe.Invoice) {
  const mapableId = invoice.metadata?.invoiceId;
  if (!mapableId) return;
  if (invoice.status === "paid") {
    await updateInvoiceStatus(mapableId, "paid", { paidAt: new Date() });
  } else if (invoice.status === "open" && invoice.attempt_count) {
    await updateInvoiceStatus(mapableId, "failed");
  }
}

async function handleSubscriptionEvent(
  sub: Stripe.Subscription,
  eventType: string
) {
  const userId = sub.metadata?.mapableUserId;
  if (!userId) return;

  const statusMap: Record<string, "active" | "canceled" | "past_due" | "unpaid" | "trialing" | "incomplete"> = {
    active: "active",
    canceled: "canceled",
    past_due: "past_due",
    unpaid: "unpaid",
    trialing: "trialing",
    incomplete: "incomplete",
    incomplete_expired: "canceled",
    paused: "past_due",
  };

  const status = statusMap[sub.status] ?? "incomplete";

  const periodStart =
    "current_period_start" in sub && typeof sub.current_period_start === "number"
      ? new Date(sub.current_period_start * 1000)
      : undefined;
  const periodEnd =
    "current_period_end" in sub && typeof sub.current_period_end === "number"
      ? new Date(sub.current_period_end * 1000)
      : undefined;

  await prisma.billingSubscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: {
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      stripePriceId: sub.items.data[0]?.price?.id ?? undefined,
    },
  });

  if (!sub.id.startsWith("pending_")) {
    await prisma.billingSubscription.updateMany({
      where: { userId, stripeSubscriptionId: { startsWith: "pending_" } },
      data: { stripeSubscriptionId: sub.id, status },
    });
  }

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (customerId) {
    await ensureStripeCustomer(userId, "provider", customerId);
  }

  await writeBillingAuditLog({
    actorUserId: userId,
    entityType: "BillingSubscription",
    entityId: sub.id,
    action: eventType,
    after: { status },
  });
}

async function handleAccountUpdated(account: Stripe.Account) {
  if (account.id) {
    await syncRecipientFromStripeAccount(account.id, account);
  }

  const userId = account.metadata?.mapableUserId;
  if (!userId) return;

  const billingAccount = await prisma.billingAccount.findFirst({
    where: { userId, stripeConnectedAccountId: account.id },
  });
  if (!billingAccount) return;

  const complete =
    account.charges_enabled === true && account.payouts_enabled === true;

  await updateConnectAccount(
    billingAccount.id,
    { connectOnboardingComplete: complete },
    userId
  );
}

async function handleExternalAccountUpdated(_account: Stripe.ExternalAccount) {
  await writeBillingAuditLog({
    entityType: "PayoutRecipient",
    entityId: "external_account",
    action: "external_account_updated",
  });
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  const splitId = transfer.metadata?.payoutSplitId;
  if (!splitId) return;

  await prisma.payoutTransfer.updateMany({
    where: { stripeTransferId: transfer.id },
    data: { status: "created" },
  });

  await prisma.billingPaymentSplit.updateMany({
    where: { id: splitId },
    data: { status: "transfer_created", transferId: transfer.id },
  });
}

async function handleTransferReversed(transfer: Stripe.Transfer) {
  await prisma.payoutTransfer.updateMany({
    where: { stripeTransferId: transfer.id },
    data: { status: "reversed" },
  });

  const splitId = transfer.metadata?.payoutSplitId;
  if (splitId) {
    await prisma.billingPaymentSplit.update({
      where: { id: splitId },
      data: { status: "reversed" },
    });
  }
}

async function handleConnectedPayoutEvent(
  payout: Stripe.Payout,
  eventType: string
) {
  const stripeAccountId =
    typeof payout.destination === "string"
      ? payout.destination
      : undefined;

  if (!stripeAccountId) return;

  const recipient = await prisma.payoutRecipient.findUnique({
    where: { stripeAccountId },
  });
  if (!recipient) return;

  if (eventType === "payout.failed") {
    await prisma.payoutRecipient.update({
      where: { id: recipient.id },
      data: { verificationStatus: "action_required" },
    });
  }

  await writeBillingAuditLog({
    entityType: "PayoutRecipient",
    entityId: recipient.id,
    action: eventType,
    after: { payoutId: payout.id, status: payout.status },
  });
}
