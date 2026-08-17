import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  detectBackupRecoveryForShift,
  proposeBackupCandidates,
} from "@/lib/care/backup-shift-recovery-service";
import { providerWorkforceConfig } from "@/lib/config/provider-workforce";
import { isBackupRecoveryEnabled } from "@/lib/config/y2-orchestration";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export type WorkerCancellationRecoveryOption = {
  optionKey: string;
  label: string;
  description: string;
  requiresParticipantConfirmation: true;
  autoAssignable: false;
  sortOrder: number;
};

export type WorkerCancellationRecoveryPlan = {
  careShiftId: string;
  cancelledWorkerId: string | null;
  options: WorkerCancellationRecoveryOption[];
  silentSubstitutionForbidden: true;
  confirmationRequired: true;
};

function assertRecoveryEnabled() {
  if (!isBackupRecoveryEnabled()) {
    throw new Error("WORKER_CANCELLATION_RECOVERY_DISABLED");
  }
  if (providerWorkforceConfig.automaticAssignmentEnabled) {
    throw new Error("SILENT_SUBSTITUTION_FORBIDDEN");
  }
}

/**
 * Deterministic recovery options — never includes silent auto-assign paths.
 */
export function buildWorkerCancellationRecoveryOptions(input: {
  careShiftId: string;
  cancelledWorkerId?: string | null;
}): WorkerCancellationRecoveryPlan {
  return {
    careShiftId: input.careShiftId,
    cancelledWorkerId: input.cancelledWorkerId ?? null,
    silentSubstitutionForbidden: true,
    confirmationRequired: true,
    options: [
      {
        optionKey: "review_backup_candidates",
        label: "Review backup worker candidates",
        description:
          "See verified backup workers who meet eligibility and availability. No worker is assigned until you confirm.",
        requiresParticipantConfirmation: true,
        autoAssignable: false,
        sortOrder: 0,
      },
      {
        optionKey: "request_human_coordination",
        label: "Request human coordinator assistance",
        description:
          "A support coordinator will contact you with alternatives. Existing bookings stay unchanged until you decide.",
        requiresParticipantConfirmation: true,
        autoAssignable: false,
        sortOrder: 1,
      },
      {
        optionKey: "reschedule_with_approval",
        label: "Reschedule the shift",
        description:
          "Move the shift to a new time with your explicit approval. No automatic rescheduling occurs.",
        requiresParticipantConfirmation: true,
        autoAssignable: false,
        sortOrder: 2,
      },
    ],
  };
}

export function assertRecoveryOptionRequiresConfirmation(
  option: WorkerCancellationRecoveryOption,
) {
  if (!option.requiresParticipantConfirmation) {
    throw new Error("CONFIRMATION_REQUIRED");
  }
  if (option.autoAssignable) {
    throw new Error("SILENT_SUBSTITUTION_FORBIDDEN");
  }
}

export async function initiateWorkerCancellationRecovery(params: {
  careShiftId: string;
  cancelledWorkerId: string;
  actorUserId: string;
  reason?: string;
}) {
  assertRecoveryEnabled();

  const plan = buildWorkerCancellationRecoveryOptions({
    careShiftId: params.careShiftId,
    cancelledWorkerId: params.cancelledWorkerId,
  });

  const recovery = await detectBackupRecoveryForShift({
    careShiftId: params.careShiftId,
    excludedWorkerId: params.cancelledWorkerId,
    actorUserId: params.actorUserId,
    notes: params.reason ?? "Worker cancellation — recovery initiated",
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "care.worker_cancellation.recovery_initiated",
    entityType: "BackupShiftRecovery",
    entityId: recovery.id,
    participantId: recovery.participantId,
    metadata: {
      careShiftId: params.careShiftId,
      cancelledWorkerId: params.cancelledWorkerId,
      optionKeys: plan.options.map((o) => o.optionKey),
    },
  });

  await notifyUser(
    recovery.participantId,
    "booking",
    "Shift cover options available",
    "A worker cancellation affects your shift. Review options and confirm your choice — nothing changes until you approve.",
  );

  return { recovery, plan };
}

export async function confirmWorkerCancellationRecoveryOption(params: {
  recoveryId: string;
  optionKey: string;
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

  const plan = buildWorkerCancellationRecoveryOptions({
    careShiftId: recovery.careShiftId,
    cancelledWorkerId: recovery.excludedWorkerId,
  });
  const option = plan.options.find((o) => o.optionKey === params.optionKey);
  if (!option) throw new Error("INVALID_OPTION");
  assertRecoveryOptionRequiresConfirmation(option);

  await createAuditEvent({
    actorUserId: params.participantUserId,
    action: "care.worker_cancellation.option_confirmed",
    entityType: "BackupShiftRecovery",
    entityId: params.recoveryId,
    participantId: params.participantUserId,
    metadata: { optionKey: params.optionKey },
  });

  if (option.optionKey === "review_backup_candidates") {
    const proposed = await proposeBackupCandidates(
      params.recoveryId,
      params.participantUserId,
    );
    return { option, recovery: proposed.recovery, candidates: proposed.candidates };
  }

  if (option.optionKey === "request_human_coordination") {
    const updated = await prisma.backupShiftRecovery.update({
      where: { id: params.recoveryId },
      data: { status: "escalated", notes: "Participant requested human coordination" },
    });
    return { option, recovery: updated, candidates: [] };
  }

  const updated = await prisma.backupShiftRecovery.update({
    where: { id: params.recoveryId },
    data: {
      status: "awaiting_participant",
      notes: "Participant chose reschedule — coordinator follow-up required",
    },
  });
  return { option, recovery: updated, candidates: [] };
}
