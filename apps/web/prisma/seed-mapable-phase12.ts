import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedMapAblePhase12() {
  console.log("Seeding MapAble Core Phase 12...");

  await prisma.constitutionalSafeguard.upsert({
    where: { articleKey: "platform_purpose" },
    create: {
      articleKey: "platform_purpose",
      title: "Public-interest purpose",
      body: "MapAble operates for disability and community service outcomes, not surveillance.",
      status: "active",
      sortOrder: 0,
      ratifiedAt: new Date(),
    },
    update: {},
  });

  await prisma.nationalAccountabilityPublication.create({
    data: {
      periodLabel: "2026-H1",
      title: "Pilot accountability summary",
      summary: "Aggregate operational and safeguarding metrics for public review.",
      category: "operations",
      status: "published",
      publishedAt: new Date(),
      metricsJson: { note: "Seed placeholder metrics" },
    },
  }).catch(() => null);

  await prisma.communityGovernanceMembership.create({
    data: {
      memberLabel: "Community advisory cohort (pilot)",
      membershipType: "advisory",
      region: "VIC",
    },
  }).catch(() => null);

  await prisma.federatedAccountabilityPartner.create({
    data: {
      partnerName: "Regional council pilot",
      jurisdiction: "VIC",
      scope: "aggregate_transport_reporting",
    },
  }).catch(() => null);

  console.log("  Phase 12 seed complete");
}
