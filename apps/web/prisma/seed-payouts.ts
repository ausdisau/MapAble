/**
 * Seed payout demo data for development.
 * Run: npx tsx prisma/seed-payouts.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { email: "alice@example.com" } });
  if (!user) {
    console.log("Run prisma db seed first — alice@example.com not found");
    return;
  }

  const org = await prisma.organisation.findFirst({
    where: { organisationType: "care_provider" },
  });

  const recipient = await prisma.payoutRecipient.upsert({
    where: { id: "seed-payout-recipient-worker" },
    create: {
      id: "seed-payout-recipient-worker",
      userId: user.id,
      recipientType: "support_worker",
      displayName: user.name,
      email: user.email,
      stripeOnboardingStatus: "pending",
    },
    update: {},
  });

  if (org) {
    await prisma.payoutRecipient.upsert({
      where: { id: "seed-payout-recipient-org" },
      create: {
        id: "seed-payout-recipient-org",
        providerOrgId: org.id,
        recipientType: "provider_org",
        displayName: org.name,
        email: "payouts@example.com",
        stripeOnboardingStatus: "not_started",
      },
      update: {},
    });
  }

  console.log("Payout seed complete:", recipient.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
