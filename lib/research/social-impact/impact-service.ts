import { phase5Config } from "@/lib/config/phase5";
import { phase7Config } from "@/lib/config/phase7";
import { prisma } from "@/lib/prisma";

export async function recordSocialImpactOutcome(params: {
  outcomeKey: string;
  value: number;
  cohortSize: number;
  definition: string;
}) {
  if (!phase7Config.socialImpactMeasurementEnabled) {
    return { skipped: true };
  }

  const suppressed =
    params.cohortSize > 0 &&
    params.cohortSize < phase5Config.smallCellSuppressionThreshold;

  return prisma.socialImpactOutcome.create({
    data: {
      ...params,
      suppressed,
      periodEnd: new Date(),
      value: suppressed ? 0 : params.value,
    },
  });
}

export async function getSocialImpactDashboard() {
  const outcomes = await prisma.socialImpactOutcome.findMany({
    orderBy: { periodEnd: "desc" },
    take: 30,
  });
  return {
    outcomes: outcomes.map((o) => ({
      outcomeKey: o.outcomeKey,
      value: o.suppressed ? null : o.value,
      suppressed: o.suppressed,
      definition: o.definition,
      cohortSize: o.cohortSize,
    })),
  };
}
