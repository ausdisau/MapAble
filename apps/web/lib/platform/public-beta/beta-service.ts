import type { PublicBetaFeedbackCategory } from "@prisma/client";

import { phase7Config } from "@/lib/config/phase7";
import { prisma } from "@/lib/prisma";

export async function recordBetaFeedback(params: {
  cohortId?: string;
  userId?: string;
  category: PublicBetaFeedbackCategory;
  body: string;
}) {
  if (!phase7Config.publicBetaEnabled) {
    throw new Error("PUBLIC_BETA_DISABLED");
  }
  return prisma.publicBetaFeedback.create({ data: params });
}

export async function getBetaCohortSummary(cohortId: string) {
  const feedback = await prisma.publicBetaFeedback.findMany({
    where: { cohortId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const byCategory = feedback.reduce(
    (acc, f) => {
      acc[f.category] = (acc[f.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  return { feedbackCount: feedback.length, byCategory };
}
