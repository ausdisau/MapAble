import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe/client";

/** Legacy Invoice flow — StripeCustomerLink on User. */
export async function ensureLegacyStripeCustomer(
  userId: string,
  email?: string | null
): Promise<string> {
  const existing = await prisma.stripeCustomerLink.findUnique({
    where: { userId },
  });
  if (existing) return existing.stripeCustomerId;

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { mapableUserId: userId },
  });

  await prisma.stripeCustomerLink.create({
    data: { userId, stripeCustomerId: customer.id },
  });

  return customer.id;
}
