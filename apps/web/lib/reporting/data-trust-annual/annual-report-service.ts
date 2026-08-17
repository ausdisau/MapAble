import { Prisma } from "@prisma/client";

import { phase8Config } from "@/lib/config/phase8";
import { prisma } from "@/lib/prisma";

export async function publishDataTrustAnnualReport(params: {
  yearLabel: string;
  title: string;
  summary: string;
  report: Record<string, unknown>;
}) {
  if (!phase8Config.dataTrustCouncilEnabled) {
    throw new Error("DATA_TRUST_DISABLED");
  }
  return prisma.dataTrustAnnualReport.upsert({
    where: { yearLabel: params.yearLabel },
    create: {
      yearLabel: params.yearLabel,
      title: params.title,
      summary: params.summary,
      status: "published",
      publishedAt: new Date(),
      reportJson: params.report as Prisma.InputJsonValue,
    },
    update: {
      title: params.title,
      summary: params.summary,
      status: "published",
      publishedAt: new Date(),
      reportJson: params.report as Prisma.InputJsonValue,
    },
  });
}

export async function listPublishedAnnualReports() {
  return prisma.dataTrustAnnualReport.findMany({
    where: { status: "published" },
    orderBy: { yearLabel: "desc" },
    take: 10,
  });
}
