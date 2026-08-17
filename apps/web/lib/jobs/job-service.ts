import type { EmploymentType, JobApplicationStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export async function createJobDraft(params: {
  employerOrganisationId: string;
  createdById: string;
  title: string;
  description: string;
  employmentType: EmploymentType;
  location?: string;
  remoteAllowed?: boolean;
  flexibleHours?: boolean;
  payRange?: string;
  accessibilityFeatures?: object;
  adjustmentOpennessStatement?: string;
  applicationInstructions?: string;
}) {
  const job = await prisma.job.create({
    data: {
      ...params,
      accessibilityFeatures: params.accessibilityFeatures ?? {},
      status: "draft",
    },
  });
  await createAuditEvent({
    actorUserId: params.createdById,
    action: "job.created",
    entityType: "Job",
    entityId: job.id,
    organisationId: params.employerOrganisationId,
  });
  return job;
}

export async function publishJob(jobId: string, adminUserId: string) {
  const job = await prisma.job.update({
    where: { id: jobId },
    data: { status: "published" },
  });
  await createAuditEvent({
    actorUserId: adminUserId,
    action: "job.published",
    entityType: "Job",
    entityId: jobId,
    organisationId: job.employerOrganisationId,
  });
  return job;
}

export async function closeJob(jobId: string, _actorUserId: string) {
  return prisma.job.update({
    where: { id: jobId },
    data: { status: "closed" },
  });
}

export async function createJobApplication(params: {
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
  if (
    params.reasonableAdjustmentRequest &&
    params.shareAdjustments &&
    !params.shareAdjustmentsConfirmed
  ) {
    throw new Error("ADJUSTMENT_CONFIRMATION_REQUIRED");
  }

  const app = await prisma.jobApplication.create({
    data: {
      jobId: params.jobId,
      participantId: params.participantId,
      applicantSummary: params.applicantSummary,
      coverLetter: params.coverLetter,
      reasonableAdjustmentRequest: params.shareAdjustments
        ? params.reasonableAdjustmentRequest
        : undefined,
      shareAdjustments: params.shareAdjustments ?? false,
      transportSupportNeeded: params.transportSupportNeeded ?? false,
      careSupportNeeded: params.careSupportNeeded ?? false,
      resumeDocumentId: params.resumeDocumentId,
      status: "draft",
    },
  });
  return app;
}

export async function submitJobApplication(
  applicationId: string,
  participantId: string
) {
  const app = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: "submitted", submittedAt: new Date() },
    include: { job: true },
  });

  await createAuditEvent({
    actorUserId: participantId,
    action: "job_application.submitted",
    entityType: "JobApplication",
    entityId: applicationId,
    participantId,
  });

  const admins = await prisma.user.findMany({
    where: { primaryRole: "mapable_admin" },
    select: { id: true },
  });
  for (const a of admins) {
    await notifyUser(
      a.id,
      "booking",
      "Job application submitted",
      `Application for ${app.job.title}`
    );
  }

  return app;
}

export function sanitizeApplicationForViewer(
  app: {
    reasonableAdjustmentRequest: string | null;
    shareAdjustments: boolean;
    applicantSummary: string | null;
    coverLetter: string | null;
  },
  opts: { isParticipant: boolean; isEmployerWithConsent: boolean; isAdmin: boolean }
) {
  const canSeeAdjustments =
    opts.isAdmin ||
    opts.isParticipant ||
    (opts.isEmployerWithConsent && app.shareAdjustments);

  return {
    ...app,
    reasonableAdjustmentRequest: canSeeAdjustments
      ? app.reasonableAdjustmentRequest
      : app.reasonableAdjustmentRequest
        ? "[Adjustment request on file — participant has not shared details]"
        : null,
  };
}

export async function updateApplicationStatus(
  applicationId: string,
  status: JobApplicationStatus,
  actorUserId: string
) {
  const app = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status },
  });
  await createAuditEvent({
    actorUserId,
    action: "job_application.status_updated",
    entityType: "JobApplication",
    entityId: applicationId,
  });
  return app;
}
