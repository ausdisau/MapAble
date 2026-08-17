import { Prisma } from "@prisma/client";
import type { ReportingMetricCategory } from "@prisma/client";

import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";

function suppressSmallCount(count: number) {
  if (count > 0 && count < phase5Config.smallCellSuppressionThreshold) {
    return { value: null, suppressed: true, note: "Suppressed for privacy" };
  }
  return { value: count, suppressed: false };
}

export async function generateReportingSnapshot(
  category: ReportingMetricCategory,
  createdById: string
) {
  if (!phase5Config.reportingEnabled) {
    return { disabled: true };
  }

  const metrics: Record<string, unknown> = {};

  if (category === "participants" || category === "social_impact") {
    const total = await prisma.user.count({
      where: { primaryRole: "participant" },
    });
    metrics.participantsOnboarded = {
      ...suppressSmallCount(total),
      definition: "Participants with participant role",
    };
  }

  if (category === "care") {
    metrics.careRequestsCompleted = {
      value: await prisma.careRequest.count({ where: { status: "completed" } }),
      definition: "Care requests marked completed",
    };
    metrics.shiftsCompleted = {
      value: await prisma.careShift.count({ where: { status: "completed" } }),
      definition: "Care shifts completed",
    };
  }

  if (category === "transport") {
    metrics.transportCompleted = {
      value: await prisma.transportBooking.count({
        where: { status: "completed" },
      }),
      definition: "Transport bookings completed",
    };
  }

  if (category === "incidents") {
    const critical = await prisma.incidentReport.count({
      where: { severity: "critical", status: { notIn: ["closed", "resolved"] } },
    });
    metrics.openCriticalIncidents = suppressSmallCount(critical);
  }

  if (category === "billing") {
    metrics.draftInvoices = {
      value: await prisma.invoice.count({ where: { status: "draft" } }),
      definition: "Invoices in draft — aggregate only",
    };
  }

  const snapshot = await prisma.reportingSnapshot.create({
    data: {
      snapshotDate: new Date(),
      category,
      metricsJson: metrics as Prisma.InputJsonValue,
      createdById,
    },
  });

  return { snapshot, metrics };
}

export async function getReportingSummary() {
  const latest = await prisma.reportingSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return { snapshots: latest };
}
