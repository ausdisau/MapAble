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

  if (!snapshotId) {
    return jsonOk({ dependencies: [], snapshotId: null });
  }

  const dependencies = await prisma.repositoryDependency.findMany({
    where: { snapshotId },
    orderBy: { edgeType: "asc" },
    include: {
      fromPr: { select: { number: true, title: true } },
      toPr: { select: { number: true, title: true } },
    },
  });

  return jsonOk({ dependencies, snapshotId });
}
