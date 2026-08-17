import { phase12Config } from "@/lib/config/phase12";
import { prisma } from "@/lib/prisma";

export async function createContinuityPlan(title: string, summary?: string) {
  if (!phase12Config.institutionalContinuityEnabled) {
    throw new Error("CONTINUITY_DISABLED");
  }
  return prisma.institutionalContinuityPlan.create({
    data: {
      title,
      summary,
      checkpoints: {
        create: [
          { title: "Succession documentation", category: "governance" },
          { title: "Data escrow review", category: "data" },
          { title: "Service continuity drill", category: "operations" },
        ],
      },
    },
    include: { checkpoints: true },
  });
}

export async function getContinuityDashboard() {
  const plans = await prisma.institutionalContinuityPlan.findMany({
    include: { checkpoints: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return { plans };
}
