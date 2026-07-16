import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { requireConvergenceFeature } from "@/lib/convergence-os/gates";
import { getLatestSnapshotId } from "@/lib/convergence-os/scans/repository-scan";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("branchGraph");
  if (gated) return gated;

  const { searchParams } = new URL(req.url);
  const snapshotId =
    searchParams.get("snapshotId") ?? (await getLatestSnapshotId());
  const risk = searchParams.get("collisionRisk");

  if (!snapshotId) {
    return jsonOk({ pullRequests: [], snapshotId: null });
  }

  const pullRequests = await prisma.repositoryPullRequest.findMany({
    where: {
      snapshotId,
      ...(risk ? { collisionRisk: risk } : {}),
    },
    orderBy: [{ recommendedMergeOrder: "asc" }, { number: "asc" }],
  });

  return jsonOk({ pullRequests, snapshotId });
}
