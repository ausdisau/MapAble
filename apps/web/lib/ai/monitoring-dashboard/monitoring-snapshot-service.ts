import { Prisma } from "@prisma/client";

import { getAiGovernanceDashboard } from "@/lib/ai/governance/governance-service";
import { prisma } from "@/lib/prisma";

export async function captureAiMonitoringSnapshot() {
  const dashboard = await getAiGovernanceDashboard();
  const fairnessTrend = await prisma.fairnessCheck.groupBy({
    by: ["status"],
    _count: true,
  });

  return prisma.aiMonitoringDashboardSnapshot.create({
    data: {
      metricsJson: {
        openIncidents: dashboard.incidents.length,
        fairnessWarningCount: dashboard.fairnessWarningCount,
        fairnessTrend,
        capturedAt: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
}
