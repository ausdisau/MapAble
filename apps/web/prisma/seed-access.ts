import { PrismaClient } from "@prisma/client";

import { ACCREDITATION_CRITERIA } from "../lib/access/accreditation/accreditation-criteria-service";

const prisma = new PrismaClient();

async function main() {
  for (const c of ACCREDITATION_CRITERIA) {
    await prisma.accessAccreditationCriterion.upsert({
      where: { code: c.code },
      create: {
        code: c.code,
        domain: c.domain,
        title: c.title,
        weight: c.weight,
        sortOrder: ACCREDITATION_CRITERIA.indexOf(c),
      },
      update: {
        domain: c.domain,
        title: c.title,
        weight: c.weight,
      },
    });
  }

  const existing = await prisma.accessPlace.count();
  if (existing === 0) {
    await prisma.accessPlace.create({
      data: {
        name: "MapAble Access Demo Café",
        category: "cafe_restaurant",
        description: "Sample published place for development.",
        addressText: "1 Example Street",
        suburb: "Sydney",
        stateOrRegion: "NSW",
        status: "published",
        sourceType: "manual_admin",
        confidence: "mapable_verified",
        location: {
          create: { latitude: -33.8688, longitude: 151.2093 },
        },
        features: {
          create: [{ type: "step_free_entry" }, { type: "accessible_toilet" }],
        },
      },
    });
  }

  console.log("Access seed complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
