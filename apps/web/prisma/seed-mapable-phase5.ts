import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedMapAblePhase5() {
  console.log("Seeding MapAble Core Phase 5...");

  await prisma.matchingModelVersion.upsert({
    where: { version: "rules-plus-assist-v1" },
    create: {
      version: "rules-plus-assist-v1",
      provider: "disabled",
      active: true,
      description: "Phase 5 placeholder — enable external provider when approved",
    },
    update: { active: true },
  });

  const ndiaProfile = await prisma.ndiaIntegrationProfile.findFirst();
  if (!ndiaProfile) {
    await prisma.ndiaIntegrationProfile.create({
      data: { mode: "manual_export", notes: "Dry-run and manual export only" },
    });
  }

  const frameworks = ["soc2", "iso27001"] as const;
  for (const type of frameworks) {
    const exists = await prisma.securityFramework.findFirst({ where: { type } });
    if (!exists) {
      await prisma.securityFramework.create({
        data: {
          type,
          name: type === "soc2" ? "SOC 2 readiness" : "ISO 27001 readiness",
        },
      });
    }
  }

  await prisma.complianceControl.upsert({
    where: { code: "CONSENT_BEFORE_SHARE" },
    create: {
      code: "CONSENT_BEFORE_SHARE",
      title: "Consent before sharing participant data",
      module: "core",
      status: "implemented",
    },
    update: {},
  });

  console.log("  Phase 5 seed complete");
}
