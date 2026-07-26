import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createGrantReport(params: {
  grantCode: string;
  periodLabel: string;
  outcomes: Record<string, unknown>;
}) {
  return prisma.grantReport.create({
    data: {
      grantCode: params.grantCode,
      periodLabel: params.periodLabel,
      outcomesJson: params.outcomes as Prisma.InputJsonValue,
      status: "draft",
    },
  });
}

export async function submitGrantReport(reportId: string) {
  return prisma.grantReport.update({
    where: { id: reportId },
    data: { status: "submitted", submittedAt: new Date() },
  });
}

export async function getGrantReportsDashboard() {
  return prisma.grantReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
