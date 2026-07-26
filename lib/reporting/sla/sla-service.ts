import { Prisma } from "@prisma/client";

import { phase8Config } from "@/lib/config/phase8";
import { prisma } from "@/lib/prisma";

export async function generateSlaReport(periodStart: Date, periodEnd: Date) {
  if (!phase8Config.slaReportingEnabled) {
    throw new Error("SLA_REPORTING_DISABLED");
  }

  const auditCount = await prisma.auditEvent.count({
    where: { createdAt: { gte: periodStart, lte: periodEnd } },
  });

  const metricsJson = {
    auditEventsLogged: auditCount,
    availabilityPercent: 99.5,
    p95ResponseMs: 450,
    note: "Placeholder SLA metrics — wire to observability in production.",
  };

  return prisma.slaReport.create({
    data: {
      periodStart,
      periodEnd,
      availabilityPercent: metricsJson.availabilityPercent,
      p95ResponseMs: metricsJson.p95ResponseMs,
      status: "draft",
      metricsJson: metricsJson as Prisma.InputJsonValue,
    },
  });
}

export async function getSlaReportsDashboard() {
  return prisma.slaReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
