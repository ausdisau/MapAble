import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe/client";
import { stripeConfig } from "@/lib/stripe/config";
import { ensureLegacyStripeCustomer } from "@/lib/stripe/customers";
import { legacyInvoiceMetadata } from "@/lib/stripe/metadata";

export async function createPaymentIntentForLegacyInvoice(params: {
  invoiceId: string;
  amountCents: number;
  userId: string;
  currency?: string;
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    include: { participant: true },
  });
  if (!invoice) {
    return { ok: false as const, error: "Invoice not found" };
  }

  const stripe = getStripeClient();
  const currency = (params.currency ?? stripeConfig.defaultCurrency).toLowerCase();

  const customerId = await ensureLegacyStripeCustomer(
    params.userId,
    invoice.participant.email
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: params.amountCents,
    currency,
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    metadata: legacyInvoiceMetadata({
      invoiceId: params.invoiceId,
      userId: params.userId,
      purpose: "participant_private_pay",
    }),
  });

  await prisma.stripePaymentIntentRecord.upsert({
    where: { stripePaymentIntentId: paymentIntent.id },
    create: {
      invoiceId: params.invoiceId,
      stripePaymentIntentId: paymentIntent.id,
      amountCents: params.amountCents,
      currency: currency.toUpperCase(),
      status: paymentIntent.status,
    },
    update: {
      status: paymentIntent.status,
      amountCents: params.amountCents,
    },
  });

  await prisma.invoice.update({
    where: { id: params.invoiceId },
    data: { status: "stripe_payment_pending" },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "stripe.payment_intent_created",
    entityType: "Invoice",
    entityId: params.invoiceId,
  });

  return {
    ok: true as const,
    configured: true,
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    metadata: paymentIntent.metadata,
  };
}
