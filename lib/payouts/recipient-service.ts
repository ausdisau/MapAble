import type {
  PayoutRecipientType,
  StripeOnboardingStatus,
} from "@prisma/client";

import { writeBillingAuditLog } from "@/lib/billing/core/audit";
import { connectRefreshUrl, connectReturnUrl } from "@/lib/payouts/config";
import { prisma } from "@/lib/prisma";
import {
  createConnectDashboardLink,
  createRecipientConnectAccount,
} from "@/lib/stripe/connect";

export type CreatePayoutRecipientInput = {
  recipientType: PayoutRecipientType;
  userId?: string;
  providerOrgId?: string;
  workerId?: string;
  email: string;
  displayName: string;
  country?: string;
  dashboardPreference?: "express";
};

export async function createPayoutRecipient(
  input: CreatePayoutRecipientInput,
  actorUserId: string
) {
  const existing = await prisma.payoutRecipient.findFirst({
    where: {
      recipientType: input.recipientType,
      OR: [
        input.userId ? { userId: input.userId } : {},
        input.providerOrgId ? { providerOrgId: input.providerOrgId } : {},
        input.workerId ? { workerId: input.workerId } : {},
      ].filter((clause) => Object.keys(clause).length > 0),
    },
  });
  if (existing) return existing;

  const recipient = await prisma.payoutRecipient.create({
    data: {
      recipientType: input.recipientType,
      userId: input.userId,
      providerOrgId: input.providerOrgId,
      workerId: input.workerId,
      email: input.email,
      displayName: input.displayName,
      country: input.country ?? "AU",
      stripeDashboardType: input.dashboardPreference ?? "express",
    },
  });

  const stripeAccount = await createRecipientConnectAccount({
    email: input.email,
    displayName: input.displayName,
    country: input.country ?? "AU",
    metadata: {
      payoutRecipientId: recipient.id,
      recipientType: input.recipientType,
    },
  });

  const updated = await prisma.payoutRecipient.update({
    where: { id: recipient.id },
    data: {
      stripeAccountId: stripeAccount.id,
      stripeAccountApiVersion: "accounts_v1",
      stripeOnboardingStatus: "pending",
    },
  });

  await writeBillingAuditLog({
    actorUserId,
    entityType: "PayoutRecipient",
    entityId: recipient.id,
    action: "recipient_created",
    after: { stripeAccountId: stripeAccount.id },
  });

  return updated;
}

export async function createOnboardingLink(recipientId: string) {
  const recipient = await prisma.payoutRecipient.findUnique({
    where: { id: recipientId },
  });
  if (!recipient?.stripeAccountId) {
    throw new Error("Recipient has no Stripe connected account.");
  }

  const stripe = await import("@/lib/stripe/client").then((m) =>
    m.getStripeClient()
  );
  const link = await stripe.accountLinks.create({
    account: recipient.stripeAccountId,
    refresh_url: connectRefreshUrl(),
    return_url: connectReturnUrl(),
    type: "account_onboarding",
  });
  return link.url;
}

export async function createDashboardLinkForRecipient(recipientId: string) {
  const recipient = await prisma.payoutRecipient.findUnique({
    where: { id: recipientId },
  });
  if (!recipient?.stripeAccountId) {
    throw new Error("Recipient has no Stripe connected account.");
  }
  return createConnectDashboardLink(recipient.stripeAccountId);
}

export function plainLanguageOnboardingStatus(
  status: StripeOnboardingStatus,
  transfersEnabled: boolean,
  payoutsEnabled: boolean
): { label: string; description: string } {
  switch (status) {
    case "not_started":
      return {
        label: "Not started",
        description: "Set up your payout account to receive transfers after completed services.",
      };
    case "pending":
    case "restricted":
      return {
        label: "Action required",
        description:
          "Stripe needs more information before MapAble can send transfers to your account.",
      };
    case "enabled":
      if (transfersEnabled && payoutsEnabled) {
        return {
          label: "Ready to receive transfers",
          description:
            "Your connected account is ready. Transfers arrive in your Stripe balance; bank timing depends on your payout schedule.",
        };
      }
      return {
        label: "Under review",
        description: "Stripe is reviewing your account details.",
      };
    case "rejected":
    case "disabled":
      return {
        label: "Disabled — contact support",
        description:
          "Your payout account cannot receive transfers. Contact MapAble support for help.",
      };
    default:
      return {
        label: "Unknown",
        description: "Check your payout setup status.",
      };
  }
}

export async function syncRecipientFromStripeAccount(
  stripeAccountId: string,
  account: {
    charges_enabled?: boolean;
    payouts_enabled?: boolean;
    requirements?: { currently_due?: string[] | null } | null;
  }
) {
  const recipient = await prisma.payoutRecipient.findUnique({
    where: { stripeAccountId },
  });
  if (!recipient) return null;

  const requirementsDue = account.requirements?.currently_due ?? [];
  const transfersEnabled = account.charges_enabled ?? false;
  const payoutsEnabled = account.payouts_enabled ?? false;

  let onboardingStatus: StripeOnboardingStatus = "pending";
  if (transfersEnabled && payoutsEnabled && requirementsDue.length === 0) {
    onboardingStatus = "enabled";
  } else if (requirementsDue.length > 0) {
    onboardingStatus = "restricted";
  }

  return prisma.payoutRecipient.update({
    where: { id: recipient.id },
    data: {
      chargesEnabled: transfersEnabled,
      payoutsEnabled,
      transfersEnabled,
      requirementsDue,
      stripeOnboardingStatus: onboardingStatus,
      verificationStatus:
        onboardingStatus === "enabled" ? "verified" : "action_required",
    },
  });
}

export async function getRecipientForUser(userId: string) {
  return prisma.payoutRecipient.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getRecipientForOrganisation(orgId: string) {
  return prisma.payoutRecipient.findFirst({
    where: { providerOrgId: orgId, recipientType: "provider_org" },
  });
}

export async function assertRecipientAccess(
  recipientId: string,
  userId: string,
  isAdmin: boolean
) {
  const recipient = await prisma.payoutRecipient.findUnique({
    where: { id: recipientId },
  });
  if (!recipient) return { ok: false as const, error: "Recipient not found" };
  if (isAdmin) return { ok: true as const, recipient };
  if (recipient.userId === userId) return { ok: true as const, recipient };

  if (recipient.providerOrgId) {
    const membership = await prisma.organisationMember.findFirst({
      where: {
        organisationId: recipient.providerOrgId,
        userId,
        role: { in: ["provider_admin", "mapable_admin"] },
      },
    });
    if (membership) return { ok: true as const, recipient };
  }

  return { ok: false as const, error: "Forbidden" };
}
