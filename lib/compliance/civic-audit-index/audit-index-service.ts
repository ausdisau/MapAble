import { Prisma } from "@prisma/client";

import { phase12Config } from "@/lib/config/phase12";
import { prisma } from "@/lib/prisma";

export async function publishCivicAuditIndex(params: {
  auditYear: string;
  title: string;
  overallScore: number;
  findings: Record<string, unknown>;
}) {
  if (!phase12Config.civicAuditIndexEnabled) {
    throw new Error("CIVIC_AUDIT_DISABLED");
  }
  return prisma.civicAuditIndexEntry.upsert({
    where: { auditYear: params.auditYear },
    create: {
      auditYear: params.auditYear,
      title: params.title,
      overallScore: params.overallScore,
      findingsJson: params.findings as Prisma.InputJsonValue,
      status: "published",
      publishedAt: new Date(),
    },
    update: {
      title: params.title,
      overallScore: params.overallScore,
      findingsJson: params.findings as Prisma.InputJsonValue,
      status: "published",
      publishedAt: new Date(),
    },
  });
}

export async function listPublishedCivicAudits() {
  if (!phase12Config.civicAuditIndexEnabled) return [];
  return prisma.civicAuditIndexEntry.findMany({
    where: { status: "published" },
    orderBy: { auditYear: "desc" },
    take: 10,
  });
}
