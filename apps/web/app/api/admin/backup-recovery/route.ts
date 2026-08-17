import { processAtRiskShiftForBackupRecovery } from "@/lib/admin/service-ops";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getBackupRecoveryPilotMetrics,
  listBackupRecoveriesForAdmin,
  reportBackupRecoveryMisfit,
} from "@/lib/care/backup-recovery-pilot";
import {
  assignBackupRecovery,
  proposeBackupCandidates,
} from "@/lib/care/backup-shift-recovery-service";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const view = url.searchParams.get("view");

  if (view === "metrics") {
    return jsonOk(await getBackupRecoveryPilotMetrics());
  }

  const status = url.searchParams.get("status") ?? undefined;
  return jsonOk({ recoveries: await listBackupRecoveriesForAdmin({ status }) });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const body = await req.json();
  const action = body.action as string;

  if (action === "detect") {
    const result = await processAtRiskShiftForBackupRecovery({
      careShiftId: body.careShiftId,
      actorUserId: user.id,
    });
    return jsonOk(result);
  }

  if (action === "propose") {
    const result = await proposeBackupCandidates(body.recoveryId, user.id);
    return jsonOk(result);
  }

  if (action === "assign") {
    const result = await assignBackupRecovery({
      recoveryId: body.recoveryId,
      actorUser: user,
    });
    return jsonOk(result);
  }

  if (action === "report_misfit") {
    if (!body.recoveryId || !body.severity || !body.notes) {
      return jsonError("Missing recoveryId, severity, or notes", 400);
    }
    const recovery = await reportBackupRecoveryMisfit({
      recoveryId: body.recoveryId,
      severity: body.severity,
      notes: body.notes,
      actorUserId: user.id,
    });
    return jsonOk({ recovery });
  }

  return jsonError("Unknown action", 400);
}
