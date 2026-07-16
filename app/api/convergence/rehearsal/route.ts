import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { requireConvergenceFeature } from "@/lib/convergence-os/gates";
import { runFoundationTrainRehearsal } from "@/lib/convergence-os/rehearsal/lab";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("rehearsal");
  if (gated) return gated;

  const runs = await prisma.rehearsalRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return jsonOk({ runs, mutatesRealBranches: false });
}

export async function POST() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("rehearsal");
  if (gated) return gated;

  const result = await runFoundationTrainRehearsal();
  return jsonOk({
    result,
    mutatesRealBranches: false,
    note: "Disposable advisory rehearsal — no product branch merges",
  });
}
