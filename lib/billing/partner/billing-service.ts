import { phase9Config } from "@/lib/config/phase9";
import { prisma } from "@/lib/prisma";

export async function ensurePartnerBillingAccount(
  organisationId: string,
  billingEmail?: string
) {
  if (!phase9Config.publicApiPartnerProgramEnabled) {
    return prisma.partnerBillingAccount.upsert({
      where: { organisationId },
      create: { organisationId, billingEmail, planCode: "standard" },
      update: { billingEmail },
    });
  }
  return prisma.partnerBillingAccount.upsert({
    where: { organisationId },
    create: { organisationId, billingEmail, planCode: "partner_api" },
    update: { billingEmail },
  });
}

export async function createPartnerInvoice(
  accountId: string,
  periodLabel: string,
  amountCents: number
) {
  return prisma.partnerBillingInvoice.create({
    data: {
      accountId,
      periodLabel,
      amountCents,
      dueAt: new Date(Date.now() + 30 * 86400000),
    },
  });
}

export async function getPartnerBillingDashboard() {
  const accounts = await prisma.partnerBillingAccount.findMany({
    include: { invoices: { orderBy: { createdAt: "desc" }, take: 5 } },
    take: 30,
  });
  return { accounts };
}
