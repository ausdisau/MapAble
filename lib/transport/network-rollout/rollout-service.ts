import type { TransportNetworkRolloutStatus } from "@prisma/client";

import { phase8Config } from "@/lib/config/phase8";
import { prisma } from "@/lib/prisma";

export async function upsertTransportRegion(params: {
  code: string;
  name: string;
  status?: TransportNetworkRolloutStatus;
  rolloutPercent?: number;
}) {
  return prisma.transportNetworkRegion.upsert({
    where: { code: params.code },
    create: {
      code: params.code,
      name: params.name,
      status: params.status ?? "planned",
      rolloutPercent: params.rolloutPercent ?? 0,
    },
    update: {
      name: params.name,
      status: params.status,
      rolloutPercent: params.rolloutPercent,
    },
  });
}

export async function getTransportNetworkRolloutSummary() {
  const regions = await prisma.transportNetworkRegion.findMany({
    orderBy: { code: "asc" },
  });
  const operatorCount = await prisma.organisation.count({
    where: { organisationType: "transport_provider" },
  });

  return {
    enabled: phase8Config.nationalInsightsEnabled,
    regions,
    totalOperators: operatorCount,
  };
}
