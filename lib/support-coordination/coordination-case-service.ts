import type {
  CoordinationCaseStatus,
  CoordinationNoteVisibility,
  CoordinationOperationalPriority,
  Prisma,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  ensureSupportCoordinationEnabled,
  supportCoordinationConfig,
} from "@/lib/config/support-coordination";
import { prisma } from "@/lib/prisma";
import { requireCoordinatorAuthority } from "@/lib/support-coordinator/consent-gate";

const CASE_INCLUDE = {
  participant: { select: { id: true, name: true } },
  coordinator: { select: { id: true, name: true } },
  tasks: { where: { status: "open" }, orderBy: { createdAt: "asc" } },
  assignments: { where: { endsAt: null }, orderBy: { assignedAt: "desc" } },
  _count: { select: { notes: true, enquiries: true, evidenceRequests: true } },
} as const satisfies Prisma.CoordinationCaseInclude;

export type CoordinationCaseWithRelations = Prisma.CoordinationCaseGetPayload<{
  include: typeof CASE_INCLUDE;
}>;

export interface CreateCoordinationCaseInput {
  participantId: string;
  coordinatorId: string;
  title: string;
  organisationId?: string | null;
  operationalPriority?: CoordinationOperationalPriority;
  linkedCaseId?: string | null;
  linkedMissionId?: string | null;
}

export async function createCase(
  input: CreateCoordinationCaseInput,
  actorUserId: string,
) {
  ensureSupportCoordinationEnabled();
  await requireCoordinatorAuthority({
    participantId: input.participantId,
    coordinatorId: actorUserId,
    action: "manage",
  });

  const created = await prisma.coordinationCase.create({
    data: {
      participantId: input.participantId,
      coordinatorId: input.coordinatorId,
      title: input.title,
      organisationId: input.organisationId ?? null,
      operationalPriority: input.operationalPriority ?? "medium",
      linkedCaseId: input.linkedCaseId ?? null,
      linkedMissionId: input.linkedMissionId ?? null,
    },
    include: CASE_INCLUDE,
  });

  await createAuditEvent({
    actorUserId,
    participantId: input.participantId,
    action: "coordination_case.created",
    entityType: "CoordinationCase",
    entityId: created.id,
    organisationId: input.organisationId ?? undefined,
  });

  return created;
}

export async function listCaseload(coordinatorId: string) {
  ensureSupportCoordinationEnabled();

  const cases = await prisma.coordinationCase.findMany({
    where: {
      coordinatorId,
      status: { not: "closed" },
    },
    include: CASE_INCLUDE,
    orderBy: [{ operationalPriority: "desc" }, { openedAt: "desc" }],
  });

  const waitingOnCounts = await prisma.coordinationTask.groupBy({
    by: ["caseId"],
    where: {
      caseId: { in: cases.map((c) => c.id) },
      status: "open",
      waitingOn: { not: null },
    },
    _count: { _all: true },
  });

  const waitingMap = new Map(
    waitingOnCounts.map((row) => [row.caseId, row._count._all]),
  );

  return cases.map((c) => ({
    ...c,
    waitingOnTaskCount: waitingMap.get(c.id) ?? 0,
  }));
}

export async function assignCase(input: {
  caseId: string;
  assigneeId: string;
  role: string;
  actorUserId: string;
}) {
  ensureSupportCoordinationEnabled();

  const coordinationCase = await prisma.coordinationCase.findUnique({
    where: { id: input.caseId },
  });
  if (!coordinationCase) throw new Error("COORDINATION_CASE_NOT_FOUND");

  await requireCoordinatorAuthority({
    participantId: coordinationCase.participantId,
    coordinatorId: input.actorUserId,
    action: "manage",
  });

  return prisma.coordinationCaseAssignment.create({
    data: {
      caseId: input.caseId,
      assigneeId: input.assigneeId,
      role: input.role,
    },
  });
}

export async function addNote(input: {
  caseId: string;
  authorId: string;
  body: string;
  visibility?: CoordinationNoteVisibility;
}) {
  ensureSupportCoordinationEnabled();

  const coordinationCase = await prisma.coordinationCase.findUnique({
    where: { id: input.caseId },
  });
  if (!coordinationCase) throw new Error("COORDINATION_CASE_NOT_FOUND");

  await requireCoordinatorAuthority({
    participantId: coordinationCase.participantId,
    coordinatorId: input.authorId,
    action: "manage",
  });

  return prisma.coordinationCaseNote.create({
    data: {
      caseId: input.caseId,
      authorId: input.authorId,
      body: input.body,
      visibility: input.visibility ?? "internal",
    },
  });
}

export async function addTask(input: {
  caseId: string;
  title: string;
  createdById: string;
  assigneeId?: string | null;
  waitingOn?: string | null;
  dueAt?: Date | null;
}) {
  ensureSupportCoordinationEnabled();

  const coordinationCase = await prisma.coordinationCase.findUnique({
    where: { id: input.caseId },
  });
  if (!coordinationCase) throw new Error("COORDINATION_CASE_NOT_FOUND");

  await requireCoordinatorAuthority({
    participantId: coordinationCase.participantId,
    coordinatorId: input.createdById,
    action: "manage",
  });

  return prisma.coordinationTask.create({
    data: {
      caseId: input.caseId,
      title: input.title,
      createdById: input.createdById,
      assigneeId: input.assigneeId ?? null,
      waitingOn: input.waitingOn ?? null,
      dueAt: input.dueAt ?? null,
    },
  });
}

/**
 * Operational priority only — not participant risk scoring.
 */
export async function setPriority(input: {
  caseId: string;
  operationalPriority: CoordinationOperationalPriority;
  actorUserId: string;
  status?: CoordinationCaseStatus;
}) {
  ensureSupportCoordinationEnabled();

  const coordinationCase = await prisma.coordinationCase.findUnique({
    where: { id: input.caseId },
  });
  if (!coordinationCase) throw new Error("COORDINATION_CASE_NOT_FOUND");

  await requireCoordinatorAuthority({
    participantId: coordinationCase.participantId,
    coordinatorId: input.actorUserId,
    action: "manage",
  });

  if (!supportCoordinationConfig.fundingDecisionEnabled) {
    // Priority changes are operational triage only; no funding side-effects.
  }

  return prisma.coordinationCase.update({
    where: { id: input.caseId },
    data: {
      operationalPriority: input.operationalPriority,
      ...(input.status ? { status: input.status } : {}),
      ...(input.status === "closed" ? { closedAt: new Date() } : {}),
    },
    include: CASE_INCLUDE,
  });
}

export async function getCaseForCoordinator(
  caseId: string,
  coordinatorId: string,
) {
  ensureSupportCoordinationEnabled();

  const coordinationCase = await prisma.coordinationCase.findUnique({
    where: { id: caseId },
    include: CASE_INCLUDE,
  });
  if (!coordinationCase) throw new Error("COORDINATION_CASE_NOT_FOUND");

  await requireCoordinatorAuthority({
    participantId: coordinationCase.participantId,
    coordinatorId,
    action: "read",
  });

  return coordinationCase;
}
