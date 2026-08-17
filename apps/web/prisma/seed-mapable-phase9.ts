import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedMapAblePhase9() {
  console.log("Seeding MapAble Core Phase 9...");

  await prisma.nationalRolloutStage.upsert({
    where: { regionCode: "AU-NATIONAL" },
    create: {
      regionCode: "AU-NATIONAL",
      name: "National program",
      status: "pilot",
      percentComplete: 25,
    },
    update: {},
  });

  await prisma.governanceCharter.upsert({
    where: { version: "1.0-draft" },
    create: {
      version: "1.0-draft",
      title: "MapAble governance charter (draft)",
      body: "Community accountability, transparency, and safeguarding principles.",
      status: "draft",
    },
    update: {},
  });

  await prisma.publicDecisionRecord.create({
    data: {
      title: "Pilot transparency publication policy",
      summary: "Approved aggregate-only publications for /transparency.",
      decisionType: "policy",
      status: "published",
      publishedAt: new Date(),
      rationale: "Seed decision for public register demo.",
    },
  }).catch(() => null);

  await prisma.localeTranslation.upsert({
    where: {
      locale_namespace_key: {
        locale: "en-AU",
        namespace: "common",
        key: "app.title",
      },
    },
    create: {
      locale: "en-AU",
      namespace: "common",
      key: "app.title",
      value: "MapAble",
    },
    update: {},
  });

  await prisma.localeTranslation.upsert({
    where: {
      locale_namespace_key: {
        locale: "fr",
        namespace: "common",
        key: "app.title",
      },
    },
    create: {
      locale: "fr",
      namespace: "common",
      key: "app.title",
      value: "MapAble",
    },
    update: {},
  }).catch(() => null);

  console.log("  Phase 9 seed complete");
}
