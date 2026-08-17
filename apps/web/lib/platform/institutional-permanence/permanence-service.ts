import { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase12Config } from "@/lib/config/phase12";
import { phase8Config } from "@/lib/config/phase8";
import { isInstitutionalPermanenceV2Enabled } from "@/lib/config/y5-rights-infrastructure";
import { prisma } from "@/lib/prisma";

export async function publishCivicAuditIndex(params: {
  auditYear: string;
  title: string;
  overallScore: number;
  findings: Record<string, unknown>;
  actorUserId?: string;
}) {
  const enabled =
    isInstitutionalPermanenceV2Enabled() || phase12Config.civicAuditIndexEnabled;
  if (!enabled) {
    throw new Error("CIVIC_AUDIT_DISABLED");
  }

  const entry = await prisma.civicAuditIndexEntry.upsert({
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

  if (params.actorUserId) {
    await createAuditEvent({
      actorUserId: params.actorUserId,
      action: "civic_audit.published",
      entityType: "CivicAuditIndexEntry",
      entityId: entry.id,
    });
  }

  return entry;
}

export async function listPublishedCivicAudits() {
  const enabled =
    isInstitutionalPermanenceV2Enabled() || phase12Config.civicAuditIndexEnabled;
  if (!enabled) return [];
  return prisma.civicAuditIndexEntry.findMany({
    where: { status: "published" },
    orderBy: { auditYear: "desc" },
    take: 10,
  });
}

export async function reviewContinuityCheckpoint(params: {
  checkpointId: string;
  actorUserId: string;
  completed: boolean;
  reviewNotes?: string;
}) {
  if (!isInstitutionalPermanenceV2Enabled() && !phase12Config.institutionalContinuityEnabled) {
    throw new Error("CONTINUITY_DISABLED");
  }

  return prisma.institutionalContinuityCheckpoint.update({
    where: { id: params.checkpointId },
    data: {
      completed: params.completed,
      reviewedBy: params.actorUserId,
      reviewedAt: new Date(),
      reviewNotes: params.reviewNotes,
    },
  });
}

export async function publishDataTrustAnnualReport(params: {
  yearLabel: string;
  title: string;
  summary: string;
  report: Record<string, unknown>;
  actorUserId?: string;
}) {
  const enabled =
    isInstitutionalPermanenceV2Enabled() || phase8Config.dataTrustCouncilEnabled;
  if (!enabled) {
    throw new Error("DATA_TRUST_DISABLED");
  }

  const report = await prisma.dataTrustAnnualReport.upsert({
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

  if (params.actorUserId) {
    await createAuditEvent({
      actorUserId: params.actorUserId,
      action: "data_trust_report.published",
      entityType: "DataTrustAnnualReport",
      entityId: report.id,
    });
  }

  return report;
}

export async function listPublishedAnnualReports() {
  return prisma.dataTrustAnnualReport.findMany({
    where: { status: "published" },
    orderBy: { yearLabel: "desc" },
    take: 10,
  });
}

export async function upsertConstitutionalSafeguard(params: {
  articleKey: string;
  title: string;
  body: string;
  sortOrder?: number;
  actorUserId?: string;
}) {
  const enabled =
    isInstitutionalPermanenceV2Enabled() || phase12Config.constitutionalSafeguardsEnabled;
  if (!enabled) {
    throw new Error("SAFEGUARDS_DISABLED");
  }

  const safeguard = await prisma.constitutionalSafeguard.upsert({
    where: { articleKey: params.articleKey },
    create: {
      articleKey: params.articleKey,
      title: params.title,
      body: params.body,
      sortOrder: params.sortOrder ?? 0,
      status: "active",
      ratifiedAt: new Date(),
    },
    update: {
      title: params.title,
      body: params.body,
      sortOrder: params.sortOrder,
    },
  });

  if (params.actorUserId) {
    await createAuditEvent({
      actorUserId: params.actorUserId,
      action: "safeguards.upserted",
      entityType: "ConstitutionalSafeguard",
      entityId: safeguard.id,
    });
  }

  return safeguard;
}

export async function listPublishedSustainabilityMilestones() {
  if (!isInstitutionalPermanenceV2Enabled()) return [];
  const plans = await prisma.sustainabilityPlan.findMany({
    include: { milestones: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return plans.flatMap((p) =>
    p.milestones.map((m) => ({
      planTitle: p.title,
      milestoneTitle: m.title,
      completed: m.completed,
      targetYear: m.targetYear,
    }))
  );
}
