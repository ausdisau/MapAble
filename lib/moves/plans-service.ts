import type { Prisma, RehabilitationPlanStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  ensureMovesRehabilitationEnabled,
  movesRehabilitationConfig,
} from "@/lib/config/moves-rehabilitation";
import { assertClinicalBoundaryAllowed } from "@/lib/moves/clinical-boundaries";
import { prisma } from "@/lib/prisma";

const PLAN_INCLUDE = {
  participant: { select: { id: true, name: true } },
  clinicianAuthor: { select: { id: true, name: true } },
  goals: { where: { status: "active" }, orderBy: { createdAt: "asc" } },
  versions: { orderBy: { version: "desc" }, take: 1 },
  _count: { select: { activities: true, reviews: true } },
} as const satisfies Prisma.RehabilitationPlanInclude;

export type RehabilitationPlanWithRelations = Prisma.RehabilitationPlanGetPayload<{
  include: typeof PLAN_INCLUDE;
}>;

export async function requireClinicalAuthor(userId: string) {
  const author = await prisma.clinicalAuthor.findUnique({
    where: { userId },
  });
  if (!author) {
    throw new Error("CLINICAL_AUTHOR_REQUIRED");
  }
  return author;
}

export interface CreatePlanInput {
  participantId: string;
  clinicianAuthorId: string;
  title: string;
  initialInstructions?: Record<string, unknown>;
  changeSummary?: string;
  goals?: string[];
}

export async function createPlan(input: CreatePlanInput, actorUserId: string) {
  ensureMovesRehabilitationEnabled();
  await requireClinicalAuthor(actorUserId);

  const plan = await prisma.rehabilitationPlan.create({
    data: {
      participantId: input.participantId,
      clinicianAuthorId: input.clinicianAuthorId,
      title: input.title,
      status: "draft",
      versions: {
        create: {
          version: 1,
          instructionsJson: (input.initialInstructions ??
            {}) as Prisma.InputJsonValue,
          changeSummary: input.changeSummary ?? "Initial plan version",
          authoredById: actorUserId,
        },
      },
      goals: input.goals?.length
        ? {
            create: input.goals.map((title) => ({
              participantId: input.participantId,
              title,
            })),
          }
        : undefined,
    },
    include: PLAN_INCLUDE,
  });

  await createAuditEvent({
    actorUserId,
    participantId: input.participantId,
    action: "moves.plan.created",
    entityType: "RehabilitationPlan",
    entityId: plan.id,
  });

  return plan;
}

export interface AddVersionInput {
  planId: string;
  instructionsJson: Record<string, unknown>;
  changeSummary: string;
  approve?: boolean;
}

export async function addVersion(input: AddVersionInput, actorUserId: string) {
  ensureMovesRehabilitationEnabled();
  await requireClinicalAuthor(actorUserId);

  const plan = await prisma.rehabilitationPlan.findUnique({
    where: { id: input.planId },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
  if (!plan) throw new Error("REHABILITATION_PLAN_NOT_FOUND");

  const nextVersion = (plan.versions[0]?.version ?? 0) + 1;

  const version = await prisma.rehabilitationPlanVersion.create({
    data: {
      planId: input.planId,
      version: nextVersion,
      instructionsJson: input.instructionsJson as Prisma.InputJsonValue,
      changeSummary: input.changeSummary,
      authoredById: actorUserId,
      approvedAt: input.approve ? new Date() : null,
    },
  });

  if (input.approve) {
    await prisma.rehabilitationPlan.update({
      where: { id: input.planId },
      data: { status: "active" },
    });
  }

  await createAuditEvent({
    actorUserId,
    participantId: plan.participantId,
    action: "moves.plan.version_added",
    entityType: "RehabilitationPlanVersion",
    entityId: version.id,
  });

  return version;
}

export async function acknowledgePlanVersion(input: {
  planVersionId: string;
  participantId: string;
}) {
  ensureMovesRehabilitationEnabled();
  assertClinicalBoundaryAllowed("acknowledge_plan");

  const version = await prisma.rehabilitationPlanVersion.findUnique({
    where: { id: input.planVersionId },
    include: { plan: true },
  });
  if (!version) throw new Error("PLAN_VERSION_NOT_FOUND");
  if (version.plan.participantId !== input.participantId) {
    throw new Error("PARTICIPANT_MISMATCH");
  }

  return prisma.planAcknowledgement.upsert({
    where: {
      planVersionId_participantId: {
        planVersionId: input.planVersionId,
        participantId: input.participantId,
      },
    },
    create: {
      planVersionId: input.planVersionId,
      participantId: input.participantId,
    },
    update: { acknowledgedAt: new Date() },
  });
}

export async function requestReview(input: {
  planId: string;
  reviewerId: string;
  notes?: string;
}) {
  ensureMovesRehabilitationEnabled();
  assertClinicalBoundaryAllowed("request_review");
  await requireClinicalAuthor(input.reviewerId);

  const plan = await prisma.rehabilitationPlan.findUnique({
    where: { id: input.planId },
  });
  if (!plan) throw new Error("REHABILITATION_PLAN_NOT_FOUND");

  return prisma.planReview.create({
    data: {
      planId: input.planId,
      reviewerId: input.reviewerId,
      notes: input.notes ?? "",
      status: "pending",
    },
  });
}

export async function listPlansForParticipant(participantId: string) {
  ensureMovesRehabilitationEnabled();

  return prisma.rehabilitationPlan.findMany({
    where: { participantId, status: { not: "archived" } },
    include: PLAN_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });
}

export async function listPlansForClinician(clinicianAuthorId: string) {
  ensureMovesRehabilitationEnabled();
  await requireClinicalAuthor(clinicianAuthorId);

  return prisma.rehabilitationPlan.findMany({
    where: { clinicianAuthorId },
    include: {
      ...PLAN_INCLUDE,
      reviews: { where: { status: "pending" }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listPendingReviews(reviewerId: string) {
  ensureMovesRehabilitationEnabled();
  await requireClinicalAuthor(reviewerId);

  return prisma.planReview.findMany({
    where: { reviewerId, status: "pending" },
    include: {
      plan: {
        include: {
          participant: { select: { id: true, name: true } },
          versions: { orderBy: { version: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function updatePlanStatus(input: {
  planId: string;
  status: RehabilitationPlanStatus;
  actorUserId: string;
}) {
  ensureMovesRehabilitationEnabled();

  const plan = await prisma.rehabilitationPlan.findUnique({
    where: { id: input.planId },
  });
  if (!plan) throw new Error("REHABILITATION_PLAN_NOT_FOUND");

  const isParticipant = plan.participantId === input.actorUserId;
  const isAuthor = plan.clinicianAuthorId === input.actorUserId;

  if (input.status === "paused" && !isParticipant && !isAuthor) {
    throw new Error("UNAUTHORISED");
  }
  if (input.status !== "paused" && !isAuthor) {
    await requireClinicalAuthor(input.actorUserId);
  }

  return prisma.rehabilitationPlan.update({
    where: { id: input.planId },
    data: { status: input.status },
    include: PLAN_INCLUDE,
  });
}

export async function attemptForbiddenClinicalAction(
  action: "diagnose" | "prescribe" | "alter_treatment" | "increase_intensity",
) {
  assertClinicalBoundaryAllowed(action);
}
