import type {
  CaseAIInsightKind,
  CaseCategory,
  CaseLinkType,
  CasePriority,
  CaseRiskLevel,
  CaseStatus,
  CaseTaskStatus,
  Prisma,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { caseManagementConfig } from "@/lib/config/case-management";
import { prisma } from "@/lib/prisma";

import { getCaseAIEngine } from "./ai/engine";
import type { CaseSnapshot, PersistedInsight } from "./ai/types";

export class CaseManagementDisabledError extends Error {
  constructor() {
    super("CASE_MANAGEMENT_DISABLED");
  }
}

export class CaseAIDisabledError extends Error {
  constructor() {
    super("CASE_MANAGEMENT_AI_DISABLED");
  }
}

function ensureEnabled() {
  if (!caseManagementConfig.enabled) throw new CaseManagementDisabledError();
}

function ensureAIEnabled() {
  ensureEnabled();
  if (!caseManagementConfig.aiEnabled) throw new CaseAIDisabledError();
}

const CASE_FULL_INCLUDE = {
  notes: { orderBy: { createdAt: "asc" } },
  tasks: { orderBy: { createdAt: "asc" } },
  links: { orderBy: { createdAt: "asc" } },
  insights: { orderBy: { createdAt: "desc" } },
  participant: { select: { id: true, name: true, email: true } },
  assignedTo: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
} as const satisfies Prisma.CaseInclude;

export type CaseWithRelations = Prisma.CaseGetPayload<{
  include: typeof CASE_FULL_INCLUDE;
}>;

function newReference(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CASE-${stamp}-${rand}`;
}

export interface CreateCaseInput {
  title: string;
  description?: string;
  category?: CaseCategory;
  priority?: CasePriority;
  participantId?: string | null;
  assignedToId?: string | null;
  organisationId?: string | null;
  tags?: string[];
  goals?: string[];
  dueAt?: Date | null;
}

export async function createCase(
  input: CreateCaseInput,
  actorUserId: string,
): Promise<CaseWithRelations> {
  ensureEnabled();
  const created = await prisma.case.create({
    data: {
      reference: newReference(),
      title: input.title,
      description: input.description ?? "",
      category: input.category ?? "other",
      priority: input.priority ?? "medium",
      participantId: input.participantId ?? null,
      assignedToId: input.assignedToId ?? null,
      organisationId: input.organisationId ?? null,
      createdById: actorUserId,
      tagsJson: input.tags
        ? (input.tags as unknown as Prisma.InputJsonValue)
        : undefined,
      goalsJson: input.goals
        ? (input.goals as unknown as Prisma.InputJsonValue)
        : undefined,
      dueAt: input.dueAt ?? null,
    },
    include: CASE_FULL_INCLUDE,
  });

  await createAuditEvent({
    actorUserId,
    action: "case.created",
    entityType: "Case",
    entityId: created.id,
    participantId: created.participantId ?? undefined,
    organisationId: created.organisationId ?? undefined,
    metadata: { reference: created.reference },
  });

  if (
    caseManagementConfig.aiAutoRunOnCreate &&
    caseManagementConfig.aiEnabled
  ) {
    await runCaseAI(created.id, "summary", actorUserId).catch(() => undefined);
  }

  return created;
}

export interface UpdateCaseInput {
  title?: string;
  description?: string;
  category?: CaseCategory;
  priority?: CasePriority;
  status?: CaseStatus;
  riskLevel?: CaseRiskLevel;
  participantId?: string | null;
  assignedToId?: string | null;
  tags?: string[];
  goals?: string[];
  dueAt?: Date | null;
}

export async function updateCase(
  caseId: string,
  input: UpdateCaseInput,
  actorUserId: string,
): Promise<CaseWithRelations> {
  ensureEnabled();
  const data: Prisma.CaseUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.category !== undefined) data.category = input.category;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.status !== undefined) data.status = input.status;
  if (input.riskLevel !== undefined) data.riskLevel = input.riskLevel;
  if (input.participantId !== undefined) {
    data.participant = input.participantId
      ? { connect: { id: input.participantId } }
      : { disconnect: true };
  }
  if (input.assignedToId !== undefined) {
    data.assignedTo = input.assignedToId
      ? { connect: { id: input.assignedToId } }
      : { disconnect: true };
  }
  if (input.tags !== undefined)
    data.tagsJson = input.tags as unknown as Prisma.InputJsonValue;
  if (input.goals !== undefined)
    data.goalsJson = input.goals as unknown as Prisma.InputJsonValue;
  if (input.dueAt !== undefined) data.dueAt = input.dueAt;

  if (input.status === "closed") {
    data.closedBy = { connect: { id: actorUserId } };
    data.closedAt = new Date();
  } else if (input.status !== undefined) {
    data.closedBy = { disconnect: true };
    data.closedAt = null;
  }

  const updated = await prisma.case.update({
    where: { id: caseId },
    data,
    include: CASE_FULL_INCLUDE,
  });

  await createAuditEvent({
    actorUserId,
    action: input.status === "closed" ? "case.closed" : "case.updated",
    entityType: "Case",
    entityId: caseId,
    participantId: updated.participantId ?? undefined,
  });

  return updated;
}

export async function addCaseNote(
  caseId: string,
  authorId: string,
  body: string,
  opts: { isPrivate?: boolean; pinned?: boolean } = {},
) {
  ensureEnabled();
  return prisma.caseNote.create({
    data: {
      caseId,
      authorId,
      body,
      isPrivate: opts.isPrivate ?? false,
      pinned: opts.pinned ?? false,
    },
  });
}

export interface CreateTaskInput {
  title: string;
  details?: string;
  priority?: CasePriority;
  assigneeId?: string | null;
  dueAt?: Date | null;
  aiSuggested?: boolean;
}

export async function addCaseTask(
  caseId: string,
  createdById: string,
  input: CreateTaskInput,
) {
  ensureEnabled();
  return prisma.caseTask.create({
    data: {
      caseId,
      createdById,
      title: input.title,
      details: input.details ?? null,
      priority: input.priority ?? "medium",
      assigneeId: input.assigneeId ?? null,
      dueAt: input.dueAt ?? null,
      aiSuggested: input.aiSuggested ?? false,
    },
  });
}

export async function updateCaseTask(
  taskId: string,
  actorUserId: string,
  input: {
    status?: CaseTaskStatus;
    title?: string;
    details?: string | null;
    priority?: CasePriority;
    assigneeId?: string | null;
    dueAt?: Date | null;
  },
) {
  ensureEnabled();
  const data: Prisma.CaseTaskUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.details !== undefined) data.details = input.details;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.assigneeId !== undefined) {
    data.assignee = input.assigneeId
      ? { connect: { id: input.assigneeId } }
      : { disconnect: true };
  }
  if (input.dueAt !== undefined) data.dueAt = input.dueAt;
  if (input.status !== undefined) {
    data.status = input.status;
    if (input.status === "done") {
      data.completedAt = new Date();
      data.completedBy = { connect: { id: actorUserId } };
    } else {
      data.completedAt = null;
      data.completedBy = { disconnect: true };
    }
  }
  return prisma.caseTask.update({ where: { id: taskId }, data });
}

export async function addCaseLink(
  caseId: string,
  createdById: string,
  input: {
    linkType: CaseLinkType;
    label: string;
    targetId?: string | null;
    url?: string | null;
    notes?: string | null;
  },
) {
  ensureEnabled();
  return prisma.caseLink.create({
    data: {
      caseId,
      createdById,
      linkType: input.linkType,
      label: input.label,
      targetId: input.targetId ?? null,
      url: input.url ?? null,
      notes: input.notes ?? null,
    },
  });
}

function toSnapshot(row: CaseWithRelations): CaseSnapshot {
  const tags = Array.isArray(row.tagsJson)
    ? (row.tagsJson as unknown as string[]).filter((t) => typeof t === "string")
    : [];
  return {
    id: row.id,
    reference: row.reference,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    category: row.category,
    riskLevel: row.riskLevel,
    openedAt: row.openedAt,
    dueAt: row.dueAt,
    closedAt: row.closedAt,
    participantId: row.participantId,
    assignedToId: row.assignedToId,
    tags,
    notes: row.notes.map((n) => ({
      id: n.id,
      body: n.body,
      createdAt: n.createdAt,
      pinned: n.pinned,
    })),
    tasks: row.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      dueAt: t.dueAt,
      completedAt: t.completedAt,
    })),
  };
}

export async function runCaseAI(
  caseId: string,
  kind: CaseAIInsightKind,
  requestedById: string,
) {
  ensureAIEnabled();
  const row = await prisma.case.findUnique({
    where: { id: caseId },
    include: CASE_FULL_INCLUDE,
  });
  if (!row) throw new Error("CASE_NOT_FOUND");
  if (row.aiOptOut) throw new CaseAIDisabledError();

  const engine = getCaseAIEngine();
  const snapshot = toSnapshot(row);

  let payload: PersistedInsight;
  switch (kind) {
    case "summary": {
      const result = engine.summarise(snapshot);
      payload = {
        kind,
        engine: engine.id,
        summary: result.text,
        detailJson: result,
        confidence: Math.min(engine.maxConfidence, 0.6),
        requiresReview: true,
      };
      break;
    }
    case "risk_assessment": {
      const result = engine.classifyRisk(snapshot);
      payload = {
        kind,
        engine: engine.id,
        summary: `AI suggests ${result.level} risk (score ${result.score}). ${result.rationale}`,
        detailJson: result,
        confidence: Math.min(engine.maxConfidence, 0.5 + result.score / 5),
        requiresReview: true,
      };
      break;
    }
    case "next_action": {
      const result = engine.nextActions(snapshot);
      payload = {
        kind,
        engine: engine.id,
        summary: `AI suggests ${result.length} next action(s).`,
        detailJson: result,
        confidence: Math.min(engine.maxConfidence, 0.4 + result.length * 0.05),
        requiresReview: true,
      };
      break;
    }
    default:
      throw new Error("UNSUPPORTED_AI_KIND");
  }

  const insight = await prisma.caseAIInsight.create({
    data: {
      caseId,
      kind: payload.kind,
      engine: payload.engine,
      summary: payload.summary,
      detailJson: payload.detailJson as Prisma.InputJsonValue,
      confidence: payload.confidence,
      requiresReview: payload.requiresReview,
      requestedById,
    },
  });

  await prisma.case.update({
    where: { id: caseId },
    data: { lastAiRunAt: new Date() },
  });

  await createAuditEvent({
    actorUserId: requestedById,
    action: `case.ai.${kind}`,
    entityType: "Case",
    entityId: caseId,
    participantId: row.participantId ?? undefined,
    metadata: {
      engine: payload.engine,
      confidence: payload.confidence,
    },
  });

  return insight;
}

export async function acknowledgeInsight(
  insightId: string,
  actorUserId: string,
) {
  ensureEnabled();
  return prisma.caseAIInsight.update({
    where: { id: insightId },
    data: {
      acknowledgedAt: new Date(),
      acknowledgedById: actorUserId,
      requiresReview: false,
    },
  });
}

export async function searchCasesForUser(
  userId: string,
  role: import("@/types/mapable").UserRole,
  query: string,
) {
  ensureAIEnabled();
  const { caseListWhereForUser } = await import("./case-access");
  const where = caseListWhereForUser(userId, role);
  const rows = await prisma.case.findMany({
    where,
    include: CASE_FULL_INCLUDE,
    take: 200,
    orderBy: { createdAt: "desc" },
  });
  const snapshots = rows.map(toSnapshot);
  const engine = getCaseAIEngine();
  return engine.search(query, snapshots);
}

export { toSnapshot as caseRowToSnapshot };
