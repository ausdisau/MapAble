import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { requireConvergenceFeature } from "@/lib/platform/convergence-os/gates";
import { getLatestSnapshotId } from "@/lib/platform/convergence-os/scans/repository-scan";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("mergeTrain");
  if (gated) return gated;

  const { searchParams } = new URL(req.url);
  const snapshotId =
    searchParams.get("snapshotId") ?? (await getLatestSnapshotId());

  if (!snapshotId) {
    return jsonOk({ mergeTrains: [], snapshotId: null });
  }

  const mergeTrains = await prisma.mergeTrain.findMany({
    where: { snapshotId },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return jsonOk({
    mergeTrains,
    snapshotId,
    autoMergeEnabled: false,
    note: "Advisory only. Humans execute merges in GitHub.",
  });
}
