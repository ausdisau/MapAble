import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedMapAblePhase8() {
  console.log("Seeding MapAble Core Phase 8...");

  await prisma.publicApiVersion.upsert({
    where: { version: "v1" },
    create: { version: "v1", status: "stable", changelog: "Initial public API" },
    update: {},
  });
  await prisma.publicApiVersion.upsert({
    where: { version: "v2" },
    create: {
      version: "v2",
      status: "draft",
      changelog: "Expanded partner scopes (not default)",
    },
    update: {},
  });

  await prisma.transportNetworkRegion.upsert({
    where: { code: "VIC-METRO" },
    create: {
      code: "VIC-METRO",
      name: "Victoria Metro",
      status: "pilot",
      rolloutPercent: 40,
    },
    update: {},
  });

  await prisma.transportNetworkRegion.upsert({
    where: { code: "NSW-REG" },
    create: {
      code: "NSW-REG",
      name: "NSW Regional",
      status: "planned",
      rolloutPercent: 0,
    },
    update: {},
  });

  await prisma.nationalInsightSnapshot.create({
    data: {
      periodLabel: "2026-Q2",
      metricsJson: {
        disclaimer: "Seed snapshot — aggregate only",
        careCompleted: { suppressed: false, value: 0 },
      },
      suppressed: false,
      publishedAt: new Date(),
    },
  }).catch(() => null);

  await prisma.complianceRenewal.create({
    data: {
      controlCode: "SOC2-ANNUAL",
      title: "Annual SOC2 evidence renewal",
      dueAt: new Date(Date.now() + 90 * 86400000),
      status: "pending",
    },
  }).catch(() => null);

  console.log("  Phase 8 seed complete");
}
