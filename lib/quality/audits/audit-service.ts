import type {
  CorrectiveActionStatus,
  ImprovementActionStatus,
  QualityAuditFindingSeverity,
  QualityAuditFindingStatus,
  QualityAuditPlanStatus,
} from "@prisma/client";

import { ensureQualityQmsEnabled } from "@/lib/config/quality-accreditation";
import { assertQualityComplianceAllowed } from "@/lib/quality/compliance-boundaries";
import { prisma } from "@/lib/prisma";

async function appendFindingHistory(params: {
  findingId: string;
  actorId?: string;
  fromStatus: QualityAuditFindingStatus | null;
  toStatus: QualityAuditFindingStatus;
  notes?: string;
}) {
  assertQualityComplianceAllowed("silent_audit_history_overwrite");
  return prisma.qualityAuditFindingHistory.create({ data: params });
}

async function appendCorrectiveHistory(params: {
  actionId: string;
  actorId?: string;
  fromStatus: CorrectiveActionStatus | null;
  toStatus: CorrectiveActionStatus;
  notes?: string;
}) {
  assertQualityComplianceAllowed("silent_audit_history_overwrite");
  return prisma.correctiveActionHistory.create({ data: params });
}

async function appendImprovementHistory(params: {
  actionId: string;
  actorId?: string;
  fromStatus: ImprovementActionStatus | null;
  toStatus: ImprovementActionStatus;
  notes?: string;
}) {
  assertQualityComplianceAllowed("silent_audit_history_overwrite");
  return prisma.improvementActionHistory.create({ data: params });
}

export async function createAuditPlan(params: {
  organisationId: string;
  title: string;
  scope?: string;
  scheduledAt?: Date;
  createdById: string;
}) {
  ensureQualityQmsEnabled();
  return prisma.qualityAuditPlan.create({
    data: {
      organisationId: params.organisationId,
      title: params.title,
      scope: params.scope,
      scheduledAt: params.scheduledAt,
      createdById: params.createdById,
      status: "draft",
    },
  });
}

export async function updateAuditPlanStatus(
  planId: string,
  status: QualityAuditPlanStatus,
) {
  ensureQualityQmsEnabled();
  return prisma.qualityAuditPlan.update({
    where: { id: planId },
    data: { status },
  });
}

export async function createAuditFinding(params: {
  auditPlanId: string;
  organisationId: string;
  title: string;
  description: string;
  severity?: QualityAuditFindingSeverity;
  indicatorId?: string;
  assignedToId?: string;
  actorId?: string;
}) {
  ensureQualityQmsEnabled();
  const finding = await prisma.qualityAuditFinding.create({
    data: {
      auditPlanId: params.auditPlanId,
      organisationId: params.organisationId,
      title: params.title,
      description: params.description,
      severity: params.severity ?? "minor",
      indicatorId: params.indicatorId,
      assignedToId: params.assignedToId,
      status: "open",
    },
  });

  await appendFindingHistory({
    findingId: finding.id,
    actorId: params.actorId,
    fromStatus: null,
    toStatus: "open",
    notes: "Finding recorded",
  });

  return finding;
}

export async function transitionFindingStatus(params: {
  findingId: string;
  toStatus: QualityAuditFindingStatus;
  actorId?: string;
  notes?: string;
}) {
  ensureQualityQmsEnabled();
  const existing = await prisma.qualityAuditFinding.findUniqueOrThrow({
    where: { id: params.findingId },
  });

  const updated = await prisma.qualityAuditFinding.update({
    where: { id: params.findingId },
    data: { status: params.toStatus },
  });

  await appendFindingHistory({
    findingId: params.findingId,
    actorId: params.actorId,
    fromStatus: existing.status,
    toStatus: params.toStatus,
    notes: params.notes,
  });

  return updated;
}

export async function createCorrectiveAction(params: {
  findingId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  assignedToId?: string;
  actorId?: string;
}) {
  ensureQualityQmsEnabled();
  const action = await prisma.correctiveAction.create({
    data: {
      findingId: params.findingId,
      title: params.title,
      description: params.description,
      dueDate: params.dueDate,
      assignedToId: params.assignedToId,
      status: "open",
    },
  });

  await appendCorrectiveHistory({
    actionId: action.id,
    actorId: params.actorId,
    fromStatus: null,
    toStatus: "open",
    notes: "Corrective action opened",
  });

  return action;
}

export async function transitionCorrectiveActionStatus(params: {
  actionId: string;
  toStatus: CorrectiveActionStatus;
  actorId?: string;
  notes?: string;
}) {
  ensureQualityQmsEnabled();
  const existing = await prisma.correctiveAction.findUniqueOrThrow({
    where: { id: params.actionId },
  });

  const updated = await prisma.correctiveAction.update({
    where: { id: params.actionId },
    data: { status: params.toStatus },
  });

  await appendCorrectiveHistory({
    actionId: params.actionId,
    actorId: params.actorId,
    fromStatus: existing.status,
    toStatus: params.toStatus,
    notes: params.notes,
  });

  return updated;
}

export async function createImprovementAction(params: {
  organisationId: string;
  title: string;
  description?: string;
  sourceFindingId?: string;
  targetDate?: Date;
  actorId?: string;
}) {
  ensureQualityQmsEnabled();
  const action = await prisma.improvementAction.create({
    data: {
      organisationId: params.organisationId,
      title: params.title,
      description: params.description,
      sourceFindingId: params.sourceFindingId,
      targetDate: params.targetDate,
      status: "planned",
    },
  });

  await appendImprovementHistory({
    actionId: action.id,
    actorId: params.actorId,
    fromStatus: null,
    toStatus: "planned",
    notes: "Improvement action planned",
  });

  return action;
}

export async function transitionImprovementActionStatus(params: {
  actionId: string;
  toStatus: ImprovementActionStatus;
  actorId?: string;
  notes?: string;
}) {
  ensureQualityQmsEnabled();
  const existing = await prisma.improvementAction.findUniqueOrThrow({
    where: { id: params.actionId },
  });

  const updated = await prisma.improvementAction.update({
    where: { id: params.actionId },
    data: { status: params.toStatus },
  });

  await appendImprovementHistory({
    actionId: params.actionId,
    actorId: params.actorId,
    fromStatus: existing.status,
    toStatus: params.toStatus,
    notes: params.notes,
  });

  return updated;
}

export async function getOrganisationAuditDashboard(organisationId: string) {
  ensureQualityQmsEnabled();
  const [plans, openFindings, openCorrective, openImprovements] =
    await Promise.all([
      prisma.qualityAuditPlan.count({ where: { organisationId } }),
      prisma.qualityAuditFinding.count({
        where: { organisationId, status: { not: "closed" } },
      }),
      prisma.correctiveAction.count({
        where: {
          finding: { organisationId },
          status: { not: "closed" },
        },
      }),
      prisma.improvementAction.count({
        where: { organisationId, status: { notIn: ["completed", "cancelled"] } },
      }),
    ]);

  return { plans, openFindings, openCorrective, openImprovements };
}

export async function listAuditPlans(organisationId: string) {
  ensureQualityQmsEnabled();
  return prisma.qualityAuditPlan.findMany({
    where: { organisationId },
    include: {
      findings: {
        include: {
          correctiveActions: {
            include: { history: { orderBy: { createdAt: "asc" } } },
          },
          history: { orderBy: { createdAt: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
