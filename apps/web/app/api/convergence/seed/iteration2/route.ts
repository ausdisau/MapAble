import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { requireConvergenceEnabled } from "@/lib/platform/convergence-os/gates";
import { seedIteration2 } from "@/lib/platform/convergence-os/seed/iteration2";

export async function POST() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceEnabled();
  if (gated) return gated;

  const result = await seedIteration2({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    runTwin: true,
  });

  return jsonOk(result);
}
