import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import {
  assertParticipantOwnsBooking,
  assertProviderOrgAccess,
  assertWorkerAssignedToShift,
} from "@/lib/care/access-control";
import { recordCareBookingEvent } from "@/lib/care/care-booking-service";
import { prisma } from "@/lib/prisma";

export async function ensureServiceLogDraftForShift(
  careShiftId: string,
  actorUserId: string
) {
  const user = await prisma.user.findUnique({
    where: { id: actorUserId },
    include: { roleAssignments: true },
  });
  if (!user) return null;
  const roles = [
    user.primaryRole,
    ...user.roleAssignments.map((r) => r.role),
  ] as CurrentUser["roles"];
  const actorUser: CurrentUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    timezone: user.timezone,
    locale: user.locale,
    primaryRole: user.primaryRole as CurrentUser["primaryRole"],
    roles: [...new Set(roles)],
  };
  try {
    return await createCareServiceLogDraft({
      careShiftId,
      actorUser,
    });
  } catch {
    return null;
  }
}

export async function createCareServiceLogDraft(params: {
  careShiftId: string;
  actorUser: CurrentUser;
  supportsDelivered?: unknown[];
  durationMinutes?: number;
  notes?: string;
}) {
  const shift = await prisma.careShift.findUnique({
    where: { id: params.careShiftId },
    include: { careBooking: true },
  });
  if (!shift) throw new Error("NOT_FOUND");
  await assertWorkerAssignedToShift(params.actorUser, shift);

  const careBookingId = shift.careBookingId;
  if (!careBookingId) throw new Error("BOOKING_REQUIRED");

  const existing = await prisma.careServiceLog.findUnique({
    where: { careShiftId: params.careShiftId },
  });
  if (existing) return existing;

  return prisma.careServiceLog.create({
    data: {
      careBookingId,
      careShiftId: params.careShiftId,
      participantId: shift.participantId,
      organisationId: shift.organisationId,
      workerProfileId: shift.workerProfileId,
      status: "draft",
      supportsDelivered: (params.supportsDelivered ?? []) as object,
      durationMinutes: params.durationMinutes,
      notes: params.notes,
    },
  });
}

export async function submitCareServiceLog(
  logId: string,
  actorUser: CurrentUser
) {
  const log = await prisma.careServiceLog.findUnique({
    where: { id: logId },
    include: { careShift: true },
  });
  if (!log) throw new Error("NOT_FOUND");
  if (log.careShift) {
    await assertWorkerAssignedToShift(actorUser, log.careShift);
  }

  const updated = await prisma.careServiceLog.update({
    where: { id: logId },
    data: {
      status: "submitted",
      submittedAt: new Date(),
    },
  });

  await recordCareBookingEvent({
    careBookingId: log.careBookingId,
    eventType: "service_log_submitted",
    title: "Service log submitted",
    actorUserId: actorUser.id,
  });

  await createAuditEvent({
    actorUserId: actorUser.id,
    action: "care_service_log.submitted",
    entityType: "CareServiceLog",
    entityId: logId,
    participantId: log.participantId,
    organisationId: log.organisationId,
  });

  return updated;
}

export async function confirmCareServiceLog(
  logId: string,
  actorUser: CurrentUser
) {
  const log = await prisma.careServiceLog.findUnique({ where: { id: logId } });
  if (!log) throw new Error("NOT_FOUND");
  assertParticipantOwnsBooking(actorUser, {
    participantId: log.participantId,
  });

  const updated = await prisma.careServiceLog.update({
    where: { id: logId },
    data: {
      status: "confirmed",
      confirmedById: actorUser.id,
      confirmedAt: new Date(),
      disputeReason: null,
      disputedAt: null,
    },
  });

  await createAuditEvent({
    actorUserId: actorUser.id,
    action: "care_service_log.confirmed",
    entityType: "CareServiceLog",
    entityId: logId,
    participantId: log.participantId,
  });

  return updated;
}

export async function disputeCareServiceLog(
  logId: string,
  actorUser: CurrentUser,
  disputeReason: string
) {
  const log = await prisma.careServiceLog.findUnique({ where: { id: logId } });
  if (!log) throw new Error("NOT_FOUND");
  assertParticipantOwnsBooking(actorUser, {
    participantId: log.participantId,
  });

  const updated = await prisma.careServiceLog.update({
    where: { id: logId },
    data: {
      status: "disputed",
      disputeReason,
      disputedAt: new Date(),
    },
  });

  await recordCareBookingEvent({
    careBookingId: log.careBookingId,
    eventType: "service_log_disputed",
    title: "Participant disputed service log",
    actorUserId: actorUser.id,
    metadata: { disputeReason },
  });

  await createAuditEvent({
    actorUserId: actorUser.id,
    action: "care_service_log.disputed",
    entityType: "CareServiceLog",
    entityId: logId,
    participantId: log.participantId,
    metadata: { disputeReason },
  });

  return updated;
}

export async function listServiceLogsForUser(user: CurrentUser) {
  if (isAdminRole(user.primaryRole)) {
    return prisma.careServiceLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
  if (user.primaryRole === "participant") {
    return prisma.careServiceLog.findMany({
      where: { participantId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
  if (user.primaryRole === "provider_admin") {
    const { getUserOrganisationIds } = await import("@/lib/api/phase3-scope");
    const orgIds = await getUserOrganisationIds(user.id);
    return prisma.careServiceLog.findMany({
      where: { organisationId: { in: orgIds } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
  if (user.primaryRole === "support_worker") {
    const profile = await prisma.workerProfile.findFirst({
      where: { userId: user.id },
    });
    if (!profile) return [];
    return prisma.careServiceLog.findMany({
      where: { workerProfileId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
  return [];
}

export async function getServiceLogForUser(logId: string, user: CurrentUser) {
  const log = await prisma.careServiceLog.findUnique({
    where: { id: logId },
    include: { careBooking: true, careShift: true },
  });
  if (!log) throw new Error("NOT_FOUND");

  if (isAdminRole(user.primaryRole)) return log;
  if (log.participantId === user.id) return log;
  if (user.primaryRole === "provider_admin") {
    await assertProviderOrgAccess(user, log.organisationId);
    return log;
  }
  if (log.careShift) {
    await assertWorkerAssignedToShift(user, log.careShift);
    return log;
  }
  throw new Error("FORBIDDEN");
}
