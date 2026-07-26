import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  isConvergenceMergeTrainEnabled,
  isConvergenceSchemaScanEnabled,
} from "@/lib/config/convergence-os";
import { requireConvergenceEnabled } from "@/lib/platform/convergence-os/gates";
import { runRepositoryScan } from "@/lib/platform/convergence-os/scans/repository-scan";

export async function POST() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceEnabled();
  if (gated) return gated;

  const result = await runRepositoryScan({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    includeSchemaScan: isConvergenceSchemaScanEnabled(),
    includeMergeTrain: isConvergenceMergeTrainEnabled(),
  });

  return jsonOk({
    ...result,
    autoMergeEnabled: false,
    autoMigrationEnabled: false,
  });
}
