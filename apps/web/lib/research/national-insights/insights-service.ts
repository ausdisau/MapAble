import { Prisma } from "@prisma/client";

import { phase5Config } from "@/lib/config/phase5";
import { phase8Config } from "@/lib/config/phase8";
import { y3NationalTrustConfig } from "@/lib/config/y3-national-trust";
import {
  computeContinuityAdjustedWeeks,
  getLatestBackupRecoverySuccessRate,
  getLatestReconciliationUnpaidPercent,
} from "@/lib/continuity/continuity-intelligence-service";
import { prisma } from "@/lib/prisma";
import { getTrustPassportPilotMetrics } from "@/lib/trust/passport/trust-passport-service";

function suppressMetric(n: number) {
  if (n > 0 && n < phase5Config.smallCellSuppressionThreshold) {
    return { suppressed: true, value: null };
  }
  return { suppressed: false, value: n };
}

async function councilApprovalRequired() {
  if (!phase8Config.dataTrustCouncilEnabled) return false;
  const recent = await prisma.dataTrustCouncilRecord.findFirst({
    where: { status: "approved", meetingAt: { not: null } },
    orderBy: { meetingAt: "desc" },
  });
  return !recent;
}

export async function captureNationalInsightSnapshot(periodLabel: string) {
  if (!phase8Config.nationalInsightsEnabled) {
    throw new Error("NATIONAL_INSIGHTS_DISABLED");
  }

  const [careCompleted, transportCompleted, organisations, incidents] =
    await Promise.all([
      prisma.careShift.count({ where: { status: "completed" } }),
      prisma.transportBooking.count({ where: { status: "completed" } }),
      prisma.organisation.count(),
      prisma.incidentReport.count({
        where: { createdAt: { gte: new Date(Date.now() - 90 * 86400000) } },
      }),
    ]);

  const metrics: Record<string, unknown> = {
    careCompleted: suppressMetric(careCompleted),
    transportCompleted: suppressMetric(transportCompleted),
    providerCount: suppressMetric(organisations),
    incidents90d: suppressMetric(incidents),
    capturedAt: new Date().toISOString(),
    disclaimer: "Aggregate national metrics only — no participant-identifiable data.",
  };

  if (y3NationalTrustConfig.nationalInsightsV2Enabled) {
    const [continuity, backupRate, unpaidPercent, trustMetrics] =
      await Promise.all([
        computeContinuityAdjustedWeeks(),
        getLatestBackupRecoverySuccessRate(),
        getLatestReconciliationUnpaidPercent(),
        getTrustPassportPilotMetrics(),
      ]);

    metrics.continuityAdjustedWeeks = suppressMetric(continuity.weeks);
    metrics.backupRecoverySuccessRate =
      backupRate != null
        ? suppressMetric(Math.round(backupRate))
        : { suppressed: false, value: null };
    metrics.reconciliationUnpaidPercent =
      unpaidPercent != null
        ? { suppressed: false, value: unpaidPercent }
        : { suppressed: false, value: null };
    metrics.trustPassportAdoptionRate = suppressMetric(
      Math.round(trustMetrics.adoptionPercent)
    );
    metrics.v2 = true;
  }

  const anySuppressed = Object.values(metrics).some(
    (v) => typeof v === "object" && v !== null && "suppressed" in v && v.suppressed
  );

  const needsCouncil = await councilApprovalRequired();
  const publishedAt =
    y3NationalTrustConfig.nationalInsightsV2Enabled && needsCouncil
      ? null
      : new Date();

  return prisma.nationalInsightSnapshot.create({
    data: {
      periodLabel,
      metricsJson: metrics as Prisma.InputJsonValue,
      suppressed: anySuppressed,
      publishedAt,
    },
  });
}

export async function listPublishedNationalInsights() {
  if (!phase8Config.nationalInsightsEnabled) return [];
  return prisma.nationalInsightSnapshot.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      periodLabel: true,
      metricsJson: true,
      suppressed: true,
      publishedAt: true,
    },
  });
}
