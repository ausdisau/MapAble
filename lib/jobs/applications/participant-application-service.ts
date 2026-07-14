import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { ensureJobsParticipationEnabled } from "@/lib/config/jobs-participation";
import { assertJobsFairnessAllowed } from "@/lib/jobs/fairness-boundaries";
import {
  createJobApplication,
  sanitizeApplicationForViewer,
  submitJobApplication,
} from "@/lib/jobs/job-service";
import { prisma } from "@/lib/prisma";

export async function listParticipantApplications(participantId: string) {
  ensureJobsParticipationEnabled();
  return prisma.jobApplication.findMany({
    where: { participantId },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          employmentType: true,
          status: true,
          employerOrganisation: { select: { name: true } },
        },
      },
      disclosurePreview: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getParticipantApplication(
  applicationId: string,
  participantId: string,
) {
  ensureJobsParticipationEnabled();
  const app = await prisma.jobApplication.findFirst({
    where: { id: applicationId, participantId },
    include: {
      job: {
        include: {
          employerOrganisation: { select: { name: true } },
          requirements: { orderBy: { sortOrder: "asc" } },
        },
      },
      disclosurePreview: true,
    },
  });
  if (!app) throw new Error("APPLICATION_NOT_FOUND");
  return app;
}

export async function createParticipantApplication(input: {
  jobId: string;
  participantId: string;
  applicantSummary?: string;
  coverLetter?: string;
  reasonableAdjustmentRequest?: string;
  shareAdjustments?: boolean;
  shareAdjustmentsConfirmed?: boolean;
  transportSupportNeeded?: boolean;
  careSupportNeeded?: boolean;
  resumeDocumentId?: string;
}) {
  ensureJobsParticipationEnabled();
  assertJobsFairnessAllowed("automatic_applicant_rejection");

  const job = await prisma.job.findUnique({ where: { id: input.jobId } });
  if (!job || job.status !== "published") throw new Error("JOB_NOT_AVAILABLE");

  const app = await createJobApplication(input);

  await createAuditEvent({
    actorUserId: input.participantId,
    participantId: input.participantId,
    action: "job_application.draft_created",
    entityType: "JobApplication",
    entityId: app.id,
  });

  return app;
}

export async function correctParticipantApplication(input: {
  applicationId: string;
  participantId: string;
  applicantSummary?: string;
  coverLetter?: string;
  reasonableAdjustmentRequest?: string;
  shareAdjustments?: boolean;
  shareAdjustmentsConfirmed?: boolean;
  transportSupportNeeded?: boolean;
  careSupportNeeded?: boolean;
  resumeDocumentId?: string;
}) {
  ensureJobsParticipationEnabled();

  const existing = await prisma.jobApplication.findFirst({
    where: { id: input.applicationId, participantId: input.participantId },
  });
  if (!existing) throw new Error("APPLICATION_NOT_FOUND");
  if (existing.status !== "draft" && existing.status !== "submitted") {
    throw new Error("APPLICATION_NOT_EDITABLE");
  }

  if (
    input.reasonableAdjustmentRequest &&
    input.shareAdjustments &&
    !input.shareAdjustmentsConfirmed
  ) {
    throw new Error("ADJUSTMENT_CONFIRMATION_REQUIRED");
  }

  const app = await prisma.jobApplication.update({
    where: { id: input.applicationId },
    data: {
      applicantSummary: input.applicantSummary,
      coverLetter: input.coverLetter,
      reasonableAdjustmentRequest: input.shareAdjustments
        ? input.reasonableAdjustmentRequest
        : undefined,
      shareAdjustments: input.shareAdjustments,
      transportSupportNeeded: input.transportSupportNeeded,
      careSupportNeeded: input.careSupportNeeded,
      resumeDocumentId: input.resumeDocumentId,
    },
  });

  await createAuditEvent({
    actorUserId: input.participantId,
    participantId: input.participantId,
    action: "job_application.corrected",
    entityType: "JobApplication",
    entityId: app.id,
  });

  return app;
}

export async function withdrawParticipantApplication(
  applicationId: string,
  participantId: string,
) {
  ensureJobsParticipationEnabled();

  const existing = await prisma.jobApplication.findFirst({
    where: { id: applicationId, participantId },
  });
  if (!existing) throw new Error("APPLICATION_NOT_FOUND");
  if (existing.status === "withdrawn") return existing;

  const app = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: "withdrawn" },
  });

  await createAuditEvent({
    actorUserId: participantId,
    participantId,
    action: "job_application.withdrawn",
    entityType: "JobApplication",
    entityId: app.id,
  });

  return app;
}

export async function submitParticipantApplication(
  applicationId: string,
  participantId: string,
) {
  ensureJobsParticipationEnabled();
  assertJobsFairnessAllowed("automatic_applicant_rejection");

  const existing = await prisma.jobApplication.findFirst({
    where: { id: applicationId, participantId },
    include: { disclosurePreview: true },
  });
  if (!existing) throw new Error("APPLICATION_NOT_FOUND");
  if (
    existing.disclosurePreview &&
    existing.disclosurePreview.status !== "confirmed"
  ) {
    throw new Error("DISCLOSURE_PREVIEW_NOT_CONFIRMED");
  }

  return submitJobApplication(applicationId, participantId);
}

export async function requestInterviewAdjustment(input: {
  applicationId: string;
  participantId: string;
  details: string;
}) {
  ensureJobsParticipationEnabled();

  const app = await prisma.jobApplication.findFirst({
    where: { id: input.applicationId, participantId: input.participantId },
  });
  if (!app) throw new Error("APPLICATION_NOT_FOUND");

  const request = await prisma.interviewAdjustmentRequest.upsert({
    where: { applicationId: input.applicationId },
    create: {
      applicationId: input.applicationId,
      status: "requested",
      details: input.details,
    },
    update: {
      status: "requested",
      details: input.details,
    },
  });

  await createAuditEvent({
    actorUserId: input.participantId,
    participantId: input.participantId,
    action: "interview_adjustment.requested",
    entityType: "InterviewAdjustmentRequest",
    entityId: request.id,
  });

  return request;
}

export { sanitizeApplicationForViewer };
