import type {
  EngagementSubmissionStatus,
  EngagementSubmissionType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createComplaint } from "@/lib/trust/safety/queue-service";

import { acknowledgementDueAt } from "./acknowledgement-sla";
import {
  canUserAccessSubmission,
  canUserSubmitForParticipant,
  submissionListWhereForParticipant,
} from "./engagement-access";

export type CreateEngagementSubmissionInput = {
  participantId: string;
  submittedById: string;
  delegateScope?: string;
  type: EngagementSubmissionType;
  title?: string;
  body: string;
  rating?: number;
  contextType?: string;
  contextId?: string;
  organisationId?: string;
  involvesSafety?: boolean;
  advocateInvolved?: boolean;
};

async function recordEvent(
  submissionId: string,
  eventType: string,
  actorId?: string,
  note?: string
) {
  return prisma.engagementSubmissionEvent.create({
    data: { submissionId, eventType, actorId, note },
  });
}

export async function createEngagementSubmission(
  input: CreateEngagementSubmissionInput
) {
  if (input.submittedById !== input.participantId && !input.delegateScope) {
    const submitCheck = await canUserSubmitForParticipant(
      input.participantId,
      input.submittedById,
      "family_member"
    );
    if (!submitCheck.allowed) {
      throw new Error("Not authorised to submit for this participant");
    }
    input.delegateScope = submitCheck.delegateScope;
  }

  const dueAt =
    input.type === "complaint" ? acknowledgementDueAt() : undefined;

  let complaintId: string | undefined;

  if (input.type === "complaint") {
    const complaint = await createComplaint({
      reportedById: input.submittedById,
      title: input.title ?? "Participant complaint",
      description: input.body,
      participantId: input.participantId,
      organisationId: input.organisationId,
    });
    complaintId = complaint.id;
  }

  const submission = await prisma.engagementSubmission.create({
    data: {
      participantId: input.participantId,
      submittedById: input.submittedById,
      delegateScope: input.delegateScope,
      type: input.type,
      status: "received",
      title: input.title,
      body: input.body,
      rating: input.rating,
      contextType: input.contextType,
      contextId: input.contextId,
      organisationId: input.organisationId,
      complaintId,
      involvesSafety: input.involvesSafety ?? false,
      advocateInvolved: input.advocateInvolved ?? false,
      acknowledgementDueAt: dueAt,
    },
  });

  await recordEvent(submission.id, "received", input.submittedById);

  return submission;
}

export async function listEngagementSubmissions(
  participantId: string,
  options?: { status?: EngagementSubmissionStatus; limit?: number }
) {
  return prisma.engagementSubmission.findMany({
    where: {
      ...submissionListWhereForParticipant(participantId),
      ...(options?.status ? { status: options.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
    include: {
      improvementActions: {
        where: { visibleToParticipant: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getEngagementSubmissionForUser(
  submissionId: string,
  userId: string,
  role: string
) {
  const submission = await prisma.engagementSubmission.findUnique({
    where: { id: submissionId },
    include: {
      events: { orderBy: { createdAt: "asc" } },
      improvementActions: {
        where: { visibleToParticipant: true },
        orderBy: { createdAt: "desc" },
      },
      participant: { select: { id: true, name: true } },
      submittedBy: { select: { id: true, name: true } },
    },
  });

  if (!submission) return null;

  const allowed = await canUserAccessSubmission(
    submission,
    userId,
    role,
    submission.participantId
  );
  if (!allowed) return null;

  return submission;
}

export async function acknowledgeSubmission(
  submissionId: string,
  actorId: string
) {
  const submission = await prisma.engagementSubmission.update({
    where: { id: submissionId },
    data: {
      status: "acknowledged",
      acknowledgedAt: new Date(),
    },
  });
  await recordEvent(submissionId, "acknowledged", actorId);
  return submission;
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: EngagementSubmissionStatus,
  actorId: string,
  note?: string
) {
  const data: {
    status: EngagementSubmissionStatus;
    resolvedAt?: Date;
  } = { status };

  if (status === "closed" || status === "improved") {
    data.resolvedAt = new Date();
  }

  const submission = await prisma.engagementSubmission.update({
    where: { id: submissionId },
    data,
  });

  await recordEvent(submissionId, status, actorId, note);
  return submission;
}

export async function countOpenSubmissions(participantId: string) {
  return prisma.engagementSubmission.count({
    where: {
      participantId,
      status: { notIn: ["closed", "improved"] },
    },
  });
}

export async function listAdminEngagementQueue(filters?: {
  status?: EngagementSubmissionStatus;
  type?: EngagementSubmissionType;
}) {
  return prisma.engagementSubmission.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.type ? { type: filters.type } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      participant: { select: { id: true, name: true, email: true } },
      organisation: { select: { id: true, name: true } },
    },
  });
}

export async function listProviderComplaints(
  organisationId: string,
  filters?: { status?: EngagementSubmissionStatus }
) {
  return prisma.engagementSubmission.findMany({
    where: {
      organisationId,
      type: "complaint",
      ...(filters?.status ? { status: filters.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      participant: { select: { id: true, name: true } },
      improvementActions: true,
    },
  });
}
