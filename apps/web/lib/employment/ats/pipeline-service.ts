import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function moveApplicationStage(params: {
  applicationId: string;
  stageName: string;
  changedById: string;
  organisationId: string;
}) {
  const app = await prisma.jobApplication.findUnique({
    where: { id: params.applicationId },
    include: { job: true },
  });
  if (!app || app.job.employerOrganisationId !== params.organisationId) {
    throw new Error("FORBIDDEN");
  }

  if (
    params.stageName.toLowerCase().includes("reject") &&
    app.reasonableAdjustmentRequest
  ) {
    throw new Error(
      "ACCESS_ADJUSTMENT_WARNING: Review whether rejection relates to access needs."
    );
  }

  await prisma.jobApplicationStageHistory.create({
    data: {
      applicationId: params.applicationId,
      stageName: params.stageName,
      changedById: params.changedById,
    },
  });

  await prisma.jobApplication.update({
    where: { id: params.applicationId },
    data: { status: params.stageName as never },
  });

  await createAuditEvent({
    actorUserId: params.changedById,
    action: "employer_ats.stage_changed",
    entityType: "JobApplication",
    entityId: params.applicationId,
  });

  return app;
}

export async function scheduleInterview(params: {
  applicationId: string;
  scheduledAt: Date;
  mode: "phone" | "video" | "in_person" | "written" | "other";
  createdById: string;
}) {
  const event = await prisma.interviewEvent.create({
    data: {
      applicationId: params.applicationId,
      scheduledAt: params.scheduledAt,
      mode: params.mode,
    },
  });

  const app = await prisma.jobApplication.findUnique({
    where: { id: params.applicationId },
  });
  if (app?.participantId) {
    const { notifyUser } = await import("@/lib/notifications/notification-service");
    await notifyUser(
      app.participantId,
      "booking",
      "Interview scheduled",
      `Please confirm interview details for ${params.scheduledAt.toLocaleString("en-AU")}.`
    );
  }

  return event;
}
