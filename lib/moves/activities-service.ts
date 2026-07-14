import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { ensureMovesRehabilitationEnabled } from "@/lib/config/moves-rehabilitation";
import {
  assertClinicalBoundaryAllowed,
  COMPLETION_NOT_IMPROVEMENT_DISCLAIMER,
} from "@/lib/moves/clinical-boundaries";
import { requireClinicalAuthor } from "@/lib/moves/plans-service";
import { prisma } from "@/lib/prisma";

const ACTIVITY_INCLUDE = {
  plan: {
    select: {
      id: true,
      participantId: true,
      title: true,
      status: true,
    },
  },
} as const satisfies Prisma.RehabilitationActivityInclude;

export type RehabilitationActivityWithPlan = Prisma.RehabilitationActivityGetPayload<{
  include: typeof ACTIVITY_INCLUDE;
}>;

export interface ScheduleActivityInput {
  planId: string;
  title: string;
  scheduledAt?: Date | null;
  instructionsAccessible: string;
  equipment?: unknown[];
}

export async function scheduleActivity(
  input: ScheduleActivityInput,
  actorUserId: string,
) {
  ensureMovesRehabilitationEnabled();
  assertClinicalBoundaryAllowed("schedule_activity");
  await requireClinicalAuthor(actorUserId);

  const plan = await prisma.rehabilitationPlan.findUnique({
    where: { id: input.planId },
  });
  if (!plan) throw new Error("REHABILITATION_PLAN_NOT_FOUND");

  const activity = await prisma.rehabilitationActivity.create({
    data: {
      planId: input.planId,
      title: input.title,
      scheduledAt: input.scheduledAt ?? null,
      instructionsAccessible: input.instructionsAccessible,
      equipmentJson: (input.equipment ?? []) as Prisma.InputJsonValue,
      status: "scheduled",
    },
    include: ACTIVITY_INCLUDE,
  });

  await createAuditEvent({
    actorUserId,
    participantId: plan.participantId,
    action: "moves.activity.scheduled",
    entityType: "RehabilitationActivity",
    entityId: activity.id,
  });

  return activity;
}

export interface CompleteActivityInput {
  activityId: string;
  participantId: string;
  completionNote?: string;
  participantFeedback?: string;
}

export interface ActivityCompletionResult {
  activity: RehabilitationActivityWithPlan;
  /** Explicit: completion is NOT proof of clinical improvement. */
  clinicalImprovementClaimed: false;
  disclaimer: string;
}

export async function completeActivity(
  input: CompleteActivityInput,
): Promise<ActivityCompletionResult> {
  ensureMovesRehabilitationEnabled();
  assertClinicalBoundaryAllowed("record_completion");

  const activity = await prisma.rehabilitationActivity.findUnique({
    where: { id: input.activityId },
    include: ACTIVITY_INCLUDE,
  });
  if (!activity) throw new Error("ACTIVITY_NOT_FOUND");
  if (activity.plan.participantId !== input.participantId) {
    throw new Error("PARTICIPANT_MISMATCH");
  }
  if (activity.status === "cancelled") {
    throw new Error("ACTIVITY_CANCELLED");
  }

  const updated = await prisma.rehabilitationActivity.update({
    where: { id: input.activityId },
    data: {
      status: "completed",
      completionNote: input.completionNote ?? null,
      participantFeedback: input.participantFeedback ?? null,
      completedAt: new Date(),
    },
    include: ACTIVITY_INCLUDE,
  });

  return {
    activity: updated,
    clinicalImprovementClaimed: false,
    disclaimer: COMPLETION_NOT_IMPROVEMENT_DISCLAIMER,
  };
}

export async function markActivityMissed(input: {
  activityId: string;
  actorUserId: string;
  followUpNote?: string;
}) {
  ensureMovesRehabilitationEnabled();

  const activity = await prisma.rehabilitationActivity.findUnique({
    where: { id: input.activityId },
    include: ACTIVITY_INCLUDE,
  });
  if (!activity) throw new Error("ACTIVITY_NOT_FOUND");

  const isParticipant = activity.plan.participantId === input.actorUserId;
  if (!isParticipant) {
    await requireClinicalAuthor(input.actorUserId);
  }

  return prisma.rehabilitationActivity.update({
    where: { id: input.activityId },
    data: {
      status: "missed",
      completionNote: input.followUpNote ?? "Marked as missed — follow-up may be scheduled by your clinician.",
    },
    include: ACTIVITY_INCLUDE,
  });
}

export async function listTodayActivities(participantId: string) {
  ensureMovesRehabilitationEnabled();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.rehabilitationActivity.findMany({
    where: {
      plan: { participantId, status: { in: ["active", "paused"] } },
      OR: [
        { scheduledAt: { gte: startOfDay, lte: endOfDay } },
        { scheduledAt: null, status: "scheduled" },
      ],
    },
    include: ACTIVITY_INCLUDE,
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
  });
}

export async function listActivitiesForPlan(planId: string) {
  ensureMovesRehabilitationEnabled();

  return prisma.rehabilitationActivity.findMany({
    where: { planId },
    include: ACTIVITY_INCLUDE,
    orderBy: { scheduledAt: "asc" },
  });
}
