import { Prisma } from "@prisma/client";

import { getAnalyticsSummary } from "@/lib/analytics/admin-analytics-service";
import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";
import { getProviderQualityDashboard } from "@/lib/provider/quality/quality-service";

function suppressMetric(value: number) {
  if (value > 0 && value < phase5Config.smallCellSuppressionThreshold) {
    return { suppressed: true, value: null };
  }
  return { suppressed: false, value };
}

export async function generateBoardReport(createdById: string, reportPeriod: string) {
  const analytics = await getAnalyticsSummary();
  const quality = await getProviderQualityDashboard();
  const openCritical = await prisma.incidentReport.count({
    where: { severity: "critical", status: { notIn: ["closed", "resolved"] } },
  });

  const metrics = {
    operational: analytics,
    providerQualityCount: quality.scores?.length ?? 0,
    openCriticalIncidents: suppressMetric(openCritical),
    financial: {
      analyticsSnapshot: "disabled" in analytics ? null : analytics,
      disclaimer: "Financial metrics are operational placeholders — not audited accounts.",
    },
    impact: {
      disclaimer: "Social impact metrics require approved reporting snapshots.",
    },
    safety: {
      openCriticalIncidents: suppressMetric(openCritical),
    },
  };

  return prisma.boardReportSnapshot.create({
    data: {
      reportPeriod,
      createdById,
      metricsJson: metrics as Prisma.InputJsonValue,
    },
  });
}
