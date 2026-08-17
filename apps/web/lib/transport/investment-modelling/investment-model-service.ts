import { Prisma } from "@prisma/client";

import { phase12Config } from "@/lib/config/phase12";
import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";

export async function runTransportInvestmentModel(params: {
  scenarioKey: string;
  title: string;
  regionCode?: string;
  demandIndex: number;
  supplyIndex: number;
  cohortSize: number;
}) {
  if (!phase12Config.transportInvestmentModellingEnabled) {
    throw new Error("TRANSPORT_INVESTMENT_DISABLED");
  }

  const suppressed =
    params.cohortSize > 0 &&
    params.cohortSize < phase5Config.smallCellSuppressionThreshold;

  const outputsJson = {
    roiEstimate: suppressed ? null : 1.12,
    coverageGapPercent: suppressed ? null : 18,
    disclaimer: "Scenario model only — not government investment advice.",
  };

  return prisma.transportInvestmentModelRun.create({
    data: {
      scenarioKey: params.scenarioKey,
      title: params.title,
      regionCode: params.regionCode,
      status: "published",
      suppressed,
      inputsJson: {
        demandIndex: params.demandIndex,
        supplyIndex: params.supplyIndex,
        cohortSize: params.cohortSize,
      } as Prisma.InputJsonValue,
      outputsJson: outputsJson as Prisma.InputJsonValue,
      publishedAt: new Date(),
    },
  });
}

export async function listPublishedInvestmentModels() {
  if (!phase12Config.transportInvestmentModellingEnabled) return [];
  return prisma.transportInvestmentModelRun.findMany({
    where: { status: "published", publishedAt: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
