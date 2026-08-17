import { Prisma } from "@prisma/client";

import { phase5Config } from "@/lib/config/phase5";
import { phase9Config } from "@/lib/config/phase9";
import { prisma } from "@/lib/prisma";

export async function publishImpactWave(waveLabel: string, cohortSize: number) {
  if (!phase9Config.longitudinalImpactEnabled) {
    throw new Error("LONGITUDINAL_IMPACT_DISABLED");
  }

  const suppressed =
    cohortSize > 0 && cohortSize < phase5Config.smallCellSuppressionThreshold;

  const metricsJson = {
    cohortSize,
    participationRate: suppressed ? null : 0.72,
    outcomeIndex: suppressed ? null : 1.04,
    disclaimer: "Longitudinal wave — suppressed when cohort too small.",
  };

  return prisma.longitudinalImpactWave.create({
    data: {
      waveLabel,
      status: "published",
      suppressed,
      metricsJson: metricsJson as Prisma.InputJsonValue,
      publishedAt: new Date(),
    },
  });
}

export async function listPublishedImpactWaves() {
  if (!phase9Config.longitudinalImpactEnabled) return [];
  return prisma.longitudinalImpactWave.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
