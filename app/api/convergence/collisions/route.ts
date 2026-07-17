import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { requireConvergenceFeature } from "@/lib/convergence-os/gates";
import { getLatestSnapshotId } from "@/lib/convergence-os/scans/repository-scan";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("schemaScan");
  if (gated) return gated;

  const { searchParams } = new URL(req.url);
  const snapshotId =
    searchParams.get("snapshotId") ?? (await getLatestSnapshotId());

  if (!snapshotId) {
    return jsonOk({ collisions: [], snapshotId: null });
  }

  const collisions = await prisma.migrationCollision.findMany({
    where: { snapshotId },
    orderBy: [{ severity: "asc" }, { category: "asc" }],
  });

  return jsonOk({ collisions, snapshotId });
}
