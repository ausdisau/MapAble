import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { isBackupRecoveryEnabled } from "@/lib/config/y2-orchestration";
import { requireMicroConsent } from "@/lib/consent/micro-consent-service";
import { upsertDispatchQueueItem } from "@/lib/dispatch-console/dispatch-service";
import {
  runCareWorkerMatch,
  selectMatchCandidate,
} from "@/lib/matching/matching-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

function assertRecoveryEnabled() {
  if (!isBackupRecoveryEnabled()) {
    throw new Error("BACKUP_SHIFT_RECOVERY_DISABLED");
  }
}

export async function detectBackupRecoveryForShift(params: {
  careShiftId: string;
  excludedWorkerId?: string;
  actorUserId: string;
  notes?: string;
}) {
  assertRecoveryEnabled();

  const shift = await prisma.careShift.findUnique({
    where: { id: params.careShiftId },
    include: { careRequest: true, backupRecovery: true },
  });
  if (!shift) throw new Error("NOT_FOUND");
  if (shift.backupRecovery) return shift.backupRecovery;

  const recovery = await prisma.backupShiftRecovery.create({
    data: {
      careShiftId: shift.id,
      participantId: shift.participantId,
      excludedWorkerId: params.excludedWorkerId ?? shift.workerProfileId ?? undefined,
      status: "detected",
      notes: params.notes,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "backup.recovery.started",
    entityType: "BackupShiftRecovery",
    entityId: recovery.id,
    participantId: shift.participantId,
    metadata: { careShiftId: shift.id },
  });

  return recovery;
}

export async function proposeBackupCandidates(
  recoveryId: string,
  actorUserId: string
) {
  assertRecoveryEnabled();

  const recovery = await prisma.backupShiftRecovery.findUnique({
    where: { id: recoveryId },
    include: { careShift: { include: { careRequest: true } } },
  });
  if (!recovery) throw new Error("NOT_FOUND");
  if (!recovery.careShift.careRequestId) {
    throw new Error("CARE_REQUEST_REQUIRED");
  }

  await prisma.backupShiftRecovery.update({
    where: { id: recoveryId },
    data: { status: "proposing" },
  });

  const match = await runCareWorkerMatch(
    recovery.careShift.careRequestId,
    actorUserId,
    {
      excludeWorkerProfileIds: recovery.excludedWorkerId
        ? [recovery.excludedWorkerId]
        : [],
    }
  );

  if ("skipped" in match && match.skipped) {
    throw new Error("MATCHING_DISABLED");
  }

  const topCandidates = (match.candidates ?? []).slice(0, 2);

  await prisma.backupShiftRecovery.update({
    where: { id: recoveryId },
    data: {
      matchRunId: match.run?.id,
      status: "awaiting_participant",
    },
  });

  await notifyUser(
    recovery.participantId,
    "booking",
    "Backup support options ready",
    "A shift needs cover. Review suggested workers and confirm your choice."
  );

  await createAuditEvent({
    actorUserId,
    action: "backup.recovery.proposed",
    entityType: "BackupShiftRecovery",
    entityId: recoveryId,
    participantId: recovery.participantId,
    metadata: { candidateCount: topCandidates.length },
  });

  return { recovery, matchRun: match.run, candidates: topCandidates };
}

export async function participantApproveBackupCandidate(params: {
  recoveryId: string;
  candidateId: string;
  participantUserId: string;
}) {
  assertRecoveryEnabled();

  const recovery = await prisma.backupShiftRecovery.findUnique({
    where: { id: params.recoveryId },
  });
  if (!recovery) throw new Error("NOT_FOUND");
  if (recovery.participantId !== params.participantUserId) {
    throw new Error("FORBIDDEN");
  }

  await requireMicroConsent({
    action: "match.backup_candidates",
    subjectUserId: params.participantUserId,
    actorUserId: params.participantUserId,
  });

  await selectMatchCandidate(params.candidateId, params.participantUserId, undefined, {
    participantConfirmed: true,
  });

  const updated = await prisma.backupShiftRecovery.update({
    where: { id: params.recoveryId },
    data: {
      selectedCandidateId: params.candidateId,
      status: "awaiting_dispatch",
    },
  });

  await createAuditEvent({
    actorUserId: params.participantUserId,
    action: "backup.recovery.participant_approved",
    entityType: "BackupShiftRecovery",
    entityId: params.recoveryId,
    participantId: params.participantUserId,
    metadata: { candidateId: params.candidateId },
  });

  return updated;
}

export async function assignBackupRecovery(params: {
  recoveryId: string;
  actorUser: CurrentUser;
}) {
  assertRecoveryEnabled();

  const recovery = await prisma.backupShiftRecovery.findUnique({
    where: { id: params.recoveryId },
    include: {
      careShift: { include: { careBooking: true, careRequest: true } },
    },
  });
  if (!recovery) throw new Error("NOT_FOUND");
  if (!recovery.selectedCandidateId) {
    throw new Error("CANDIDATE_NOT_SELECTED");
  }

  const canAssign =
    isAdminRole(params.actorUser.primaryRole) ||
    params.actorUser.primaryRole === "provider_admin";
  if (!canAssign) throw new Error("FORBIDDEN");

  const candidate = await prisma.matchCandidate.findUnique({
    where: { id: recovery.selectedCandidateId },
  });
  if (!candidate?.candidateWorkerId) throw new Error("INVALID_CANDIDATE");

  const shift = await prisma.careShift.update({
    where: { id: recovery.careShiftId },
    data: {
      workerProfileId: candidate.candidateWorkerId,
      status: "worker_assigned",
    },
  });

  if (recovery.careShift.careBookingId) {
    await prisma.careServiceRecoveryLink.create({
      data: {
        careBookingId: recovery.careShift.careBookingId,
        careShiftId: shift.id,
        linkType: "backup_shift_recovery",
        notes: recovery.notes ?? "Backup worker assigned after shift disruption",
      },
    });
  }

  const updated = await prisma.backupShiftRecovery.update({
    where: { id: params.recoveryId },
    data: { status: "assigned" },
  });

  await createAuditEvent({
    actorUserId: params.actorUser.id,
    action: "backup.recovery.completed",
    entityType: "BackupShiftRecovery",
    entityId: params.recoveryId,
    participantId: recovery.participantId,
    metadata: { workerProfileId: candidate.candidateWorkerId },
  });

  return { recovery: updated, shift };
}

export async function escalateBackupRecovery(
  recoveryId: string,
  actorUserId: string
) {
  assertRecoveryEnabled();

  const recovery = await prisma.backupShiftRecovery.update({
    where: { id: recoveryId },
    data: { status: "escalated" },
  });

  await upsertDispatchQueueItem({
    queueType: "general",
    title: `Backup recovery — shift ${recovery.careShiftId.slice(0, 8)}`,
    entityType: "BackupShiftRecovery",
    entityId: recoveryId,
    priority: "high",
    plainLanguageSummary:
      "No suitable backup confirmed — human dispatch required. Do not auto-assign.",
  });

  await createAuditEvent({
    actorUserId,
    action: "backup.recovery.failed",
    entityType: "BackupShiftRecovery",
    entityId: recoveryId,
    participantId: recovery.participantId,
    metadata: { escalated: true },
  });

  return recovery;
}

export async function getBackupRecoveryForShift(careShiftId: string) {
  return prisma.backupShiftRecovery.findUnique({
    where: { careShiftId },
    include: {
      careShift: true,
    },
  });
}

export async function listOpenBackupRecoveries() {
  return prisma.backupShiftRecovery.findMany({
    where: {
      status: {
        in: [
          "detected",
          "proposing",
          "awaiting_participant",
          "awaiting_dispatch",
          "escalated",
        ],
      },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
}
