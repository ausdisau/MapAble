import { PrismaClient } from "@prisma/client";

import { seedDefaultLaunchItems } from "../lib/platform/launch-readiness/launch-readiness-service";

const prisma = new PrismaClient();

export async function seedMapAblePhase6() {
  console.log("Seeding MapAble Core Phase 6...");

  await seedDefaultLaunchItems();

  await prisma.disasterRecoveryPlan.upsert({
    where: { id: "default-dr-plan" },
    create: {
      id: "default-dr-plan",
      name: "MapAble pilot DR plan",
      checklistJson: ["backup verified", "failover documented", "contacts listed"],
    },
    update: {},
  }).catch(async () => {
    const exists = await prisma.disasterRecoveryPlan.findFirst();
    if (!exists) {
      await prisma.disasterRecoveryPlan.create({
        data: { name: "MapAble pilot DR plan" },
      });
    }
  });

  await prisma.partnerSandboxApp.upsert({
    where: { id: "seed-sandbox-app" },
    create: { id: "seed-sandbox-app", name: "Demo sandbox partner", status: "sandbox" },
    update: {},
  }).catch(() =>
    prisma.partnerSandboxApp.create({ data: { name: "Demo sandbox partner" } })
  );

  console.log("  Phase 6 seed complete");
}
