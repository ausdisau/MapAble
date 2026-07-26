import { Prisma } from "@prisma/client";

import { phase5Config } from "@/lib/config/phase5";
import { phase8Config } from "@/lib/config/phase8";
import {
  PRIVACY_ANALYTICS_DISCLAIMER,
  isPrivacyAnalyticsPilotEnabled,
} from "@/lib/config/y4-civic-platform";
import { prisma } from "@/lib/prisma";

async function councilApprovalRequired() {
  if (!phase8Config.dataTrustCouncilEnabled) return false;
  const recent = await prisma.dataTrustCouncilRecord.findFirst({
    where: { status: "approved", meetingAt: { not: null } },
    orderBy: { meetingAt: "desc" },
  });
  return !recent;
}

function suppressMetric(n: number) {
  if (n > 0 && n < phase5Config.smallCellSuppressionThreshold) {
    return { suppressed: true, value: null as number | null };
  }
  return { suppressed: false, value: n };
}

export async function runPrivacyAnalyticsPilot(runLabel: string) {
  if (!isPrivacyAnalyticsPilotEnabled()) {
    throw new Error("PRIVACY_ANALYTICS_PILOT_DISABLED");
  }

  if (await councilApprovalRequired()) {
    throw new Error("COUNCIL_APPROVAL_REQUIRED");
  }

  const [careCompleted, transportCompleted, incidents] = await Promise.all([
    prisma.careShift.count({ where: { status: "completed" } }),
    prisma.transportBooking.count({ where: { status: "completed" } }),
    prisma.incidentReport.count({
      where: { createdAt: { gte: new Date(Date.now() - 90 * 86400000) } },
    }),
  ]);

  const resultJson = {
    method: "differential_privacy_placeholder",
    epsilon: 1.0,
    disclaimer: PRIVACY_ANALYTICS_DISCLAIMER,
    aggregates: {
      careCompleted: suppressMetric(careCompleted),
      transportCompleted: suppressMetric(transportCompleted),
      incidents90d: suppressMetric(incidents),
    },
    capturedAt: new Date().toISOString(),
  };

  return prisma.privacyPreservingAnalyticsRun.create({
    data: {
      runLabel,
      epsilon: 1.0,
      status: "completed",
      resultJson: resultJson as Prisma.InputJsonValue,
    },
  });
}

export async function listAnalyticsRuns() {
  return prisma.privacyPreservingAnalyticsRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export { PRIVACY_ANALYTICS_DISCLAIMER };
