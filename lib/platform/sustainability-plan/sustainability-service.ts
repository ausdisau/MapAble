import { phase10Config } from "@/lib/config/phase10";
import { prisma } from "@/lib/prisma";

export async function createSustainabilityPlan(title: string, summary?: string) {
  if (!phase10Config.sustainabilityPlanEnabled) {
    throw new Error("SUSTAINABILITY_DISABLED");
  }
  return prisma.sustainabilityPlan.create({
    data: {
      title,
      summary,
      milestones: {
        create: [
          { title: "Carbon footprint review", category: "environment", targetYear: 2027 },
          { title: "Community governance review", category: "governance", targetYear: 2026 },
          { title: "Financial resilience check", category: "financial", targetYear: 2026 },
        ],
      },
    },
    include: { milestones: true },
  });
}

export async function getSustainabilityDashboard() {
  const plans = await prisma.sustainabilityPlan.findMany({
    include: { milestones: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return { plans };
}
