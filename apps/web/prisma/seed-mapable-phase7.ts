import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedMapAblePhase7() {
  console.log("Seeding MapAble Core Phase 7...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "pilot-tenant" },
    create: { slug: "pilot-tenant", name: "Pilot tenant" },
    update: {},
  });

  await prisma.publicBetaCohort.upsert({
    where: { id: "seed-beta-cohort" },
    create: { id: "seed-beta-cohort", name: "Pilot cohort A", status: "active" },
    update: {},
  }).catch(() =>
    prisma.publicBetaCohort.create({ data: { name: "Pilot cohort A" } })
  );

  await prisma.planManagerPilotPartner.upsert({
    where: { id: "seed-pm-partner" },
    create: { id: "seed-pm-partner", name: "Demo plan manager", active: true },
    update: {},
  }).catch(() =>
    prisma.planManagerPilotPartner.create({ data: { name: "Demo plan manager" } })
  );

  await prisma.scalePlan.create({
    data: {
      title: "Pilot scale plan",
      summary: "Operational, safeguarding, financial and community readiness",
      milestones: {
        create: [
          { title: "Complete launch readiness", category: "operations" },
          { title: "Safeguarding review", category: "safeguards" },
        ],
      },
    },
  }).catch(() => null);

  const careOrg = await prisma.organisation.findFirst({
    where: { id: "seed-care-org" },
  });
  if (careOrg) {
    await prisma.enterpriseProviderWorkspace.upsert({
      where: { organisationId: careOrg.id },
      create: {
        organisationId: careOrg.id,
        tenantId: tenant.id,
        label: careOrg.name,
      },
      update: { tenantId: tenant.id },
    });
  }

  console.log("  Phase 7 seed complete");
}
