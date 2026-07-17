import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  detectBackupRecoveryForShift,
  listOpenBackupRecoveries,
} from "@/lib/care/backup-shift-recovery-service";
import {
  isBackupRecoveryEnabled,
  y2OrchestrationConfig,
} from "@/lib/config/y2-orchestration";
import { prisma } from "@/lib/prisma";

const AT_RISK_SHIFT_STATUSES = [
  "cancelled",
  "no_show",
  "worker_unassigned",
] as const;

export function isBackupRecoveryPilotEnabled() {
  return y2OrchestrationConfig.backupRecoveryPilotEnabled;
}

export async function maybeAutoDetectBackupRecovery(params: {
  careShiftId: string;
  shiftStatus: string;
  actorUserId: string;
  reason?: string;
}) {
  if (!isBackupRecoveryPilotEnabled() || !isBackupRecoveryEnabled()) {
    return { skipped: true, reason: "pilot_disabled" as const };
  }

  if (
    !AT_RISK_SHIFT_STATUSES.includes(
      params.shiftStatus as (typeof AT_RISK_SHIFT_STATUSES)[number]
    )
  ) {
    return { skipped: true, reason: "status_not_at_risk" as const };
  }

  const existing = await prisma.backupShiftRecovery.findUnique({
    where: { careShiftId: params.careShiftId },
  });
  if (existing) {
    return { skipped: true, reason: "already_exists" as const, recovery: existing };
  }

  const recovery = await detectBackupRecoveryForShift({
    careShiftId: params.careShiftId,
    actorUserId: params.actorUserId,
    notes: params.reason ?? `Auto-detected: ${params.shiftStatus}`,
  });

  await prisma.backupShiftRecovery.update({
    where: { id: recovery.id },
    data: { autoDetected: true },
  });

  return { recovery, autoDetected: true };
}

export async function reportBackupRecoveryMisfit(params: {
  recoveryId: string;
  severity: "minor" | "serious";
  notes: string;
  actorUserId: string;
}) {
  if (!isBackupRecoveryEnabled()) throw new Error("BACKUP_SHIFT_RECOVERY_DISABLED");

  const recovery = await prisma.backupShiftRecovery.update({
    where: { id: params.recoveryId },
    data: {
      misfitSeverity: params.severity,
      misfitNotes: params.notes,
      misfitReportedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "backup.recovery.misfit_reported",
    entityType: "BackupShiftRecovery",
    entityId: params.recoveryId,
    participantId: recovery.participantId,
    metadata: { severity: params.severity },
  });

  return recovery;
}

export async function getBackupRecoveryPilotMetrics() {
  const since = new Date(Date.now() - 30 * 86400000);

  const recoveries = await prisma.backupShiftRecovery.findMany({
    where: { createdAt: { gte: since } },
  });

  const total = recoveries.length;
  const assigned = recoveries.filter((r) => r.status === "assigned").length;
  const seriousMisfits = recoveries.filter(
    (r) => r.misfitSeverity === "serious"
  ).length;
  const participantApproved = recoveries.filter(
    (r) => r.selectedCandidateId != null
  ).length;

  return {
    periodDays: 30,
    total,
    assigned,
    participantApprovalRate: total > 0 ? participantApproved / total : 0,
    assignmentRate: total > 0 ? assigned / total : 0,
    seriousMisfitCount: seriousMisfits,
    killCriteriaBreached: seriousMisfits >= 2,
    openCount: (await listOpenBackupRecoveries()).length,
  };
}

export async function listBackupRecoveriesForAdmin(filters?: {
  status?: string;
}) {
  return prisma.backupShiftRecovery.findMany({
    where: filters?.status
      ? { status: filters.status as never }
      : {
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
    take: 100,
    include: {
      careShift: {
        select: {
          id: true,
          startAt: true,
          status: true,
          organisationId: true,
        },
      },
    },
  });
}
