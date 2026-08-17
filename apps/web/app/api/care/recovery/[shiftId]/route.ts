import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  assignBackupRecovery,
  detectBackupRecoveryForShift,
  escalateBackupRecovery,
  getBackupRecoveryForShift,
  participantApproveBackupCandidate,
  proposeBackupCandidates,
} from "@/lib/care/backup-shift-recovery-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { shiftId } = await params;

  const recovery = await getBackupRecoveryForShift(shiftId);
  if (!recovery) return jsonOk({ recovery: null });

  if (
    user.primaryRole !== "participant" &&
    user.primaryRole !== "mapable_admin" &&
    user.primaryRole !== "provider_admin"
  ) {
    return jsonError("Forbidden", 403);
  }

  if (user.primaryRole === "participant" && recovery.participantId !== user.id) {
    return jsonError("Forbidden", 403);
  }

  let candidates: unknown[] = [];
  if (recovery.matchRunId) {
    const { prisma } = await import("@/lib/prisma");
    candidates = await prisma.matchCandidate.findMany({
      where: { matchRunId: recovery.matchRunId },
      include: { factors: true },
      orderBy: { score: "desc" },
      take: 2,
    });
  }

  return jsonOk({ recovery, candidates });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { shiftId } = await params;
  const body = await req.json().catch(() => ({}));

  const recovery = await getBackupRecoveryForShift(shiftId);

  switch (body.action) {
    case "detect": {
      if (!isStaff(user.primaryRole)) return jsonError("Forbidden", 403);
      const created = await detectBackupRecoveryForShift({
        careShiftId: shiftId,
        excludedWorkerId: body.excludedWorkerId,
        actorUserId: user.id,
        notes: body.notes,
      });
      return jsonOk({ recovery: created });
    }
    case "propose": {
      if (!recovery) return jsonError("Recovery not found", 404);
      if (!isStaff(user.primaryRole)) return jsonError("Forbidden", 403);
      const result = await proposeBackupCandidates(recovery.id, user.id);
      return jsonOk(result);
    }
    case "approve": {
      if (!recovery) return jsonError("Recovery not found", 404);
      if (user.primaryRole !== "participant" || recovery.participantId !== user.id) {
        return jsonError("Forbidden", 403);
      }
      const updated = await participantApproveBackupCandidate({
        recoveryId: recovery.id,
        candidateId: body.candidateId,
        participantUserId: user.id,
      });
      return jsonOk({ recovery: updated });
    }
    case "assign": {
      if (!recovery) return jsonError("Recovery not found", 404);
      const result = await assignBackupRecovery({
        recoveryId: recovery.id,
        actorUser: user,
      });
      return jsonOk(result);
    }
    case "escalate": {
      if (!recovery) return jsonError("Recovery not found", 404);
      if (!isStaff(user.primaryRole)) return jsonError("Forbidden", 403);
      const updated = await escalateBackupRecovery(recovery.id, user.id);
      return jsonOk({ recovery: updated });
    }
    default:
      return jsonError("Unknown action", 400);
  }
}

function isStaff(role: string) {
  return role === "mapable_admin" || role === "provider_admin";
}
