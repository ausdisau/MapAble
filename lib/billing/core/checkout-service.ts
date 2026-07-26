import type { BillingPaymentMethod } from "@prisma/client";

import { getOrCreateBillingAccount } from "@/lib/billing/core/account-service";
import { writeBillingAuditLog } from "@/lib/billing/core/audit";
import { isBillingStripeConfigured } from "@/lib/billing/core/config";
import { checkoutDecisionForFundingType } from "@/lib/billing/core/funding-logic";
import { getInvoiceForUser, updateInvoiceStatus } from "@/lib/billing/core/invoice-service";
import { prisma } from "@/lib/prisma";
import { buildBillingPaymentCheckout } from "@/lib/stripe/checkout";
import { getStripeClient } from "@/lib/stripe/client";

export async function createCheckoutForInvoice(userId: string, invoiceId: string) {
  const invoice = await getInvoiceForUser(invoiceId, userId);
  if (!invoice) return { ok: false as const, error: "Invoice not found" };

  const fundingType = invoice.fundingSource?.type;
  const decision = checkoutDecisionForFundingType(fundingType);
  if (!decision.allowed) {
    return { ok: false as const, decision };
  }

  if (!isBillingStripeConfigured()) {
    return {
      ok: false as const,
      error: "Stripe is not configured",
      configured: false,
    };
  }

  const account = await getOrCreateBillingAccount(userId, "participant");

  let customerId = account.stripeCustomerId;
  if (!customerId) {
    const stripe = getStripeClient();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const customer = await stripe.customers.create({
      email: user?.email,
      metadata: { mapableUserId: userId },
    });
    customerId = customer.id;
    await prisma.billingAccount.update({
      where: { id: account.id },
      data: { stripeCustomerId: customerId },
    });
  }

  let providerAccountId: string | null = null;
  if (invoice.providerId) {
    const providerAccount = await prisma.billingAccount.findFirst({
      where: {
        role: "provider",
        stripeConnectedAccountId: { not: null },
        user: {
          organisationMemberships: {
            some: { organisationId: invoice.providerId },
          },
        },
      },
    });
    providerAccountId = providerAccount?.stripeConnectedAccountId ?? null;
  }

  const payment = await prisma.billingPayment.create({
    data: {
      invoiceId: invoice.id,
      userId,
      providerId: invoice.providerId,
      status: "requires_payment",
      method: "stripe_checkout" as BillingPaymentMethod,
      amountCents: invoice.totalCents,
      currency: invoice.currency,
      transferGroup: invoice.transferGroup ?? undefined,
    },
  });

  const session = await buildBillingPaymentCheckout({
    invoiceId: invoice.id,
    userId,
    serviceType: invoice.serviceType,
    bookingId: invoice.bookingId,
    paymentId: payment.id,
    transferGroup: invoice.transferGroup ?? undefined,
    fundingSourceType: invoice.fundingSource?.type,
    totalCents: invoice.totalCents,
    currency: invoice.currency,
    customerId,
    productLabel: `MapAble ${invoice.serviceType} invoice`,
    platformFeeCents: invoice.platformFeeCents,
    providerConnectedAccountId: providerAccountId,
  });

  await prisma.billingPayment.update({
    where: { id: payment.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  await updateInvoiceStatus(
    invoice.id,
    "pending_payment",
    { stripeCheckoutSessionId: session.id },
    userId
  );

  await writeBillingAuditLog({
    actorUserId: userId,
    entityType: "BillingInvoice",
    entityId: invoice.id,
    action: "checkout_session_created",
    after: { stripeCheckoutSessionId: session.id },
  });

  return {
    ok: true as const,
    checkoutUrl: session.url,
    sessionId: session.id,
  };
}
