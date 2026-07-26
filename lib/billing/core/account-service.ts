import type { BillingAccountRole } from "@prisma/client";

import { writeBillingAuditLog } from "@/lib/billing/core/audit";
import { prisma } from "@/lib/prisma";

export async function getOrCreateBillingAccount(
  userId: string,
  role: BillingAccountRole
) {
  return prisma.billingAccount.upsert({
    where: { userId_role: { userId, role } },
    create: { userId, role },
    update: {},
  });
}

export async function ensureStripeCustomer(
  userId: string,
  role: BillingAccountRole,
  stripeCustomerId: string,
  _email?: string
) {
  const account = await getOrCreateBillingAccount(userId, role);
  if (account.stripeCustomerId === stripeCustomerId) return account;

  const updated = await prisma.billingAccount.update({
    where: { id: account.id },
    data: { stripeCustomerId },
  });

  await writeBillingAuditLog({
    actorUserId: userId,
    entityType: "BillingAccount",
    entityId: account.id,
    action: "stripe_customer_linked",
    before: { stripeCustomerId: account.stripeCustomerId },
    after: { stripeCustomerId },
  });

  return updated;
}

export async function updateConnectAccount(
  accountId: string,
  data: {
    stripeConnectedAccountId?: string;
    connectOnboardingComplete?: boolean;
  },
  actorUserId?: string
) {
  const before = await prisma.billingAccount.findUnique({
    where: { id: accountId },
  });
  const updated = await prisma.billingAccount.update({
    where: { id: accountId },
    data,
  });
  await writeBillingAuditLog({
    actorUserId,
    entityType: "BillingAccount",
    entityId: accountId,
    action: "connect_account_updated",
    before,
    after: updated,
  });
  return updated;
}
