import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedMapAblePhase10() {
  console.log("Seeding MapAble Core Phase 10...");

  await prisma.registeredAlgorithm.create({
    data: {
      name: "Provider matching",
      purpose: "Suggest care and transport providers for participant requests",
      version: "1.0",
      owner: "MapAble",
      status: "published",
      fairnessNotes: "Human review required for all AI match selections.",
      publishedAt: new Date(),
    },
  }).catch(() => null);

  await prisma.sustainabilityPlan.create({
    data: {
      title: "Platform sustainability plan",
      summary: "Environmental, governance and financial milestones",
      milestones: {
        create: [
          { title: "Renewable hosting review", category: "environment", targetYear: 2027 },
          { title: "Oversight board annual review", category: "governance", targetYear: 2026 },
        ],
      },
    },
  }).catch(() => null);

  await prisma.dataTrustAnnualReport.upsert({
    where: { yearLabel: "2025-26" },
    create: {
      yearLabel: "2025-26",
      title: "Data trust annual report (draft)",
      summary: "Aggregate accountability summary for the data trust council.",
      status: "draft",
    },
    update: {},
  });

  console.log("  Phase 10 seed complete");
}
