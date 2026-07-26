import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase10Config } from "@/lib/config/phase10";
import {
  isOversightBoardV2Enabled,
  y4CivicPlatformConfig,
} from "@/lib/config/y4-civic-platform";
import { requireRatifiedCharter } from "@/lib/governance/charter/charter-gate-service";
import { prisma } from "@/lib/prisma";

export async function scheduleOversightMeeting(params: {
  title: string;
  summary: string;
  meetingAt?: Date;
}) {
  if (!isOversightBoardV2Enabled()) {
    throw new Error("OVERSIGHT_BOARD_DISABLED");
  }
  return prisma.oversightBoardMeeting.create({
    data: { ...params, status: "scheduled" },
  });
}

export async function markMeetingHeld(meetingId: string, actorUserId: string) {
  const meeting = await prisma.oversightBoardMeeting.update({
    where: { id: meetingId },
    data: { status: "held" },
  });

  await createAuditEvent({
    actorUserId,
    action: "oversight.meeting_held",
    entityType: "OversightBoardMeeting",
    entityId: meetingId,
  });

  return meeting;
}

export async function publishMeetingMinutes(
  meetingId: string,
  minutesSummary: string,
  actorUserId: string
) {
  const meeting = await prisma.oversightBoardMeeting.update({
    where: { id: meetingId },
    data: { status: "minutes_published", minutesSummary },
  });

  await createAuditEvent({
    actorUserId,
    action: "oversight.minutes_published",
    entityType: "OversightBoardMeeting",
    entityId: meetingId,
  });

  return meeting;
}

export async function publishOversightDecision(params: {
  meetingId?: string;
  title: string;
  summary: string;
  disputeContact?: string;
}) {
  if (y4CivicPlatformConfig.oversightBoardV2Enabled) {
    await requireRatifiedCharter();
  }

  return prisma.oversightBoardDecision.create({
    data: {
      ...params,
      disputeContact: params.disputeContact ?? "governance@mapable.example",
      status: "published",
      publishedAt: new Date(),
    },
  });
}

export async function getOversightPortalSummary() {
  if (!isOversightBoardV2Enabled()) {
    if (!phase10Config.oversightBoardPortalEnabled) {
      return { disabled: true, meetings: [], decisions: [] };
    }
  }

  const [meetings, decisions] = await Promise.all([
    prisma.oversightBoardMeeting.findMany({
      orderBy: { meetingAt: "desc" },
      take: 10,
    }),
    prisma.oversightBoardDecision.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      take: 20,
    }),
  ]);
  return { disabled: false, meetings, decisions };
}

export async function seedDemoOversightContent() {
  if (!y4CivicPlatformConfig.oversightBoardV2Enabled) return null;

  const existing = await prisma.oversightBoardMeeting.findFirst();
  if (existing) return existing;

  const meeting = await scheduleOversightMeeting({
    title: "Quarterly accountability review (demo)",
    summary: "Sample oversight meeting for civic platform pilot.",
    meetingAt: new Date(),
  });

  await publishMeetingMinutes(
    meeting.id,
    "Reviewed continuity metrics and algorithm register entries.",
    "system"
  );

  await publishOversightDecision({
    meetingId: meeting.id,
    title: "Continue transparency-first matching policy",
    summary:
      "Board noted explainable matching remains human-approved with no autonomous assignment.",
  });

  return meeting;
}
