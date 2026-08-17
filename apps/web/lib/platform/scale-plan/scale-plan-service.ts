import { prisma } from "@/lib/prisma";

export async function createScalePlan(title: string, summary?: string) {
  return prisma.scalePlan.create({
    data: {
      title,
      summary,
      milestones: {
        create: [
          { title: "Operational readiness", category: "operations" },
          { title: "Safeguarding readiness", category: "safeguards" },
          { title: "Financial readiness", category: "financial" },
          { title: "Community readiness", category: "community" },
        ],
      },
    },
    include: { milestones: true },
  });
}

export async function approveScalePlan(planId: string) {
  return prisma.scalePlan.update({
    where: { id: planId },
    data: { boardApproved: true, status: "approved" },
  });
}
