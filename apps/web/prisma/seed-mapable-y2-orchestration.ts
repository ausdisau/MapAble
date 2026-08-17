/**
 * Seed data for Y2 orchestration pilot (tenants, plan manager partner, sample batch).
 * Run via: pnpm exec tsx prisma/seed-mapable-y2-orchestration.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedMapableY2Orchestration() {
  const tenantA = await prisma.tenant.upsert({
    where: { slug: "pilot-provider-a" },
    create: { slug: "pilot-provider-a", name: "Pilot Provider A" },
    update: {},
  });

  const tenantB = await prisma.tenant.upsert({
    where: { slug: "pilot-provider-b" },
    create: { slug: "pilot-provider-b", name: "Pilot Provider B" },
    update: {},
  });

  const partnerExisting = await prisma.planManagerPilotPartner.findFirst({
    where: { name: "Y2 Pilot Plan Manager" },
  });
  const partner =
    partnerExisting ??
    (await prisma.planManagerPilotPartner.create({
      data: {
        name: "Y2 Pilot Plan Manager",
        exportFormat: "json",
        active: true,
      },
    }));

  console.log("Y2 orchestration seed:", {
    tenants: [tenantA.slug, tenantB.slug],
    partner: partner.name,
  });
}

if (require.main === module) {
  seedMapableY2Orchestration()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
