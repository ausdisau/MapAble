import { phase3Config } from "@/lib/config/phase3";
import { prisma } from "@/lib/prisma";

export async function createInterviewSupportDraft(
  applicationId: string,
  actorUserId: string
) {
  if (!phase3Config.orchestrationEnabled) {
    return { skipped: true };
  }

  const key = `job-interview-transport-${applicationId}`;
  const existing = await prisma.orchestrationEvent.findUnique({
    where: { idempotencyKey: key },
  });
  if (existing) return { duplicate: true };

  const app = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });
  if (!app?.transportSupportNeeded) {
    return { skipped: true, reason: "Transport not requested" };
  }

  await prisma.calendarEvent.create({
    data: {
      eventType: "job_interview",
      title: `Interview transport placeholder — ${app.job.title}`,
      description: "Draft transport support — book details later",
      startAt: new Date(Date.now() + 7 * 86400000),
      endAt: new Date(Date.now() + 7 * 86400000 + 3600000),
      participantId: app.participantId,
      jobApplicationId: app.id,
      jobId: app.jobId,
      createdById: actorUserId,
    },
  });

  await prisma.orchestrationEvent.create({
    data: {
      eventType: "interview_transport_draft_created",
      jobApplicationId: applicationId,
      idempotencyKey: key,
      createdById: actorUserId,
    },
  });

  return { calendarPlaceholder: true };
}
