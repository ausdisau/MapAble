import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { requireConvergenceFeature } from "@/lib/platform/convergence-os/gates";
import { getTwinOverview } from "@/lib/platform/convergence-os/twin/store";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("twin");
  if (gated) return gated;

  const { searchParams } = new URL(req.url);
  const snapshotId = searchParams.get("snapshotId");
  const overview = await getTwinOverview(snapshotId);

  const modules = overview.snapshotId
    ? await prisma.twinModule.findMany({
        where: { snapshotId: overview.snapshotId },
        orderBy: { moduleKey: "asc" },
        take: 100,
      })
    : overview.inventoryPreview.modules;

  return jsonOk({ overview, modules });
}
