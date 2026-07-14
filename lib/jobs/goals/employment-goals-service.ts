import type { EmploymentGoalCategory, EmploymentGoalStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { ensureJobsParticipationEnabled } from "@/lib/config/jobs-participation";
import { prisma } from "@/lib/prisma";

export async function listEmploymentGoals(participantId: string) {
  ensureJobsParticipationEnabled();
  return prisma.employmentGoal.findMany({
    where: { participantId, status: { not: "archived" } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createEmploymentGoal(input: {
  participantId: string;
  actorUserId: string;
  title: string;
  description?: string;
  category?: EmploymentGoalCategory;
  targetDate?: Date;
}) {
  ensureJobsParticipationEnabled();
  if (input.participantId !== input.actorUserId) {
    throw new Error("PARTICIPANT_AUTHORITY_REQUIRED");
  }

  const profile = await prisma.employmentProfile.upsert({
    where: { participantId: input.participantId },
    create: { participantId: input.participantId },
    update: {},
  });

  const goal = await prisma.employmentGoal.create({
    data: {
      profileId: profile.id,
      participantId: input.participantId,
      title: input.title,
      description: input.description,
      category: input.category ?? "other",
      targetDate: input.targetDate,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "employment_goal.created",
    entityType: "EmploymentGoal",
    entityId: goal.id,
  });

  return goal;
}

export async function updateEmploymentGoal(input: {
  goalId: string;
  participantId: string;
  actorUserId: string;
  title?: string;
  description?: string;
  category?: EmploymentGoalCategory;
  targetDate?: Date | null;
  status?: EmploymentGoalStatus;
}) {
  ensureJobsParticipationEnabled();
  if (input.participantId !== input.actorUserId) {
    throw new Error("PARTICIPANT_AUTHORITY_REQUIRED");
  }

  const existing = await prisma.employmentGoal.findFirst({
    where: { id: input.goalId, participantId: input.participantId },
  });
  if (!existing) throw new Error("GOAL_NOT_FOUND");

  const goal = await prisma.employmentGoal.update({
    where: { id: input.goalId },
    data: {
      title: input.title,
      description: input.description,
      category: input.category,
      targetDate: input.targetDate,
      status: input.status,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "employment_goal.updated",
    entityType: "EmploymentGoal",
    entityId: goal.id,
  });

  return goal;
}
