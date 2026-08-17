import type { EngagementImprovementActionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CreateImprovementActionInput = {
  submissionId?: string;
  participantId?: string;
  organisationId?: string;
  title: string;
  summary: string;
  sourceComplaintId?: string;
  responsibleUserId?: string;
  targetDate?: Date;
  visibleToParticipant?: boolean;
};

function generateCiReference(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 900) + 100;
  return `CI-${year}-${seq}`;
}

export async function createImprovementAction(input: CreateImprovementActionInput) {
  const action = await prisma.engagementImprovementAction.create({
    data: {
      submissionId: input.submissionId,
      participantId: input.participantId,
      organisationId: input.organisationId,
      title: input.title,
      summary: input.summary,
      status: "planned",
      ciReferenceCode: generateCiReference(),
      sourceComplaintId: input.sourceComplaintId,
      responsibleUserId: input.responsibleUserId,
      targetDate: input.targetDate,
      visibleToParticipant: input.visibleToParticipant ?? true,
    },
  });

  if (input.submissionId) {
    await prisma.engagementSubmission.update({
      where: { id: input.submissionId },
      data: { status: "action_planned" },
    });
    await prisma.engagementSubmissionEvent.create({
      data: {
        submissionId: input.submissionId,
        eventType: "action_planned",
        note: `CI action created: ${action.ciReferenceCode}`,
      },
    });
  }

  return action;
}

export async function updateImprovementAction(
  actionId: string,
  updates: {
    status?: EngagementImprovementActionStatus;
    summary?: string;
    effectivenessReview?: string;
    completedAt?: Date;
  }
) {
  const action = await prisma.engagementImprovementAction.update({
    where: { id: actionId },
    data: {
      ...updates,
      ...(updates.status === "completed" && !updates.completedAt
        ? { completedAt: new Date() }
        : {}),
    },
  });

  if (updates.status === "completed" && action.submissionId) {
    await prisma.engagementSubmission.update({
      where: { id: action.submissionId },
      data: { status: "improved", resolvedAt: new Date() },
    });
    await prisma.engagementSubmissionEvent.create({
      data: {
        submissionId: action.submissionId,
        eventType: "improved",
        note: `Improvement action completed: ${action.ciReferenceCode}`,
      },
    });
  }

  return action;
}

export async function listImprovementsForParticipant(participantId: string) {
  return prisma.engagementImprovementAction.findMany({
    where: {
      visibleToParticipant: true,
      OR: [
        { participantId },
        { submission: { participantId } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function listProviderImprovements(organisationId: string) {
  return prisma.engagementImprovementAction.findMany({
    where: { organisationId },
    orderBy: { createdAt: "desc" },
    include: {
      submission: {
        select: {
          id: true,
          type: true,
          title: true,
          complaintId: true,
          status: true,
        },
      },
    },
  });
}

export async function listAdminImprovementActions() {
  return prisma.engagementImprovementAction.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      submission: { select: { id: true, title: true, participantId: true } },
      organisation: { select: { id: true, name: true } },
    },
  });
}
