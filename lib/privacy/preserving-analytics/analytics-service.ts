import { Prisma } from "@prisma/client";

import { phase10Config } from "@/lib/config/phase10";
import { prisma } from "@/lib/prisma";

export async function runPrivacyPreservingAnalytics(runLabel: string) {
  if (!phase10Config.privacyPreservingAnalyticsEnabled) {
    throw new Error("PRIVACY_ANALYTICS_DISABLED");
  }

  const resultJson = {
    method: "differential_privacy_placeholder",
    epsilon: 1.0,
    aggregateBookingCount: "noise_added",
    disclaimer: "Placeholder — not production DP implementation.",
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
