import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { requireConvergenceFeature } from "@/lib/convergence-os/gates";
import { runTwinScan } from "@/lib/convergence-os/scans/twin-scan";

export async function POST() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("twin");
  if (gated) return gated;

  const result = await runTwinScan({
    actorUserId: user.id,
    actorRole: user.primaryRole,
  });

  return jsonOk({
    ...result,
    autoMergeEnabled: false,
    autoMigrationEnabled: false,
  });
}
