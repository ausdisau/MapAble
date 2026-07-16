import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { requireConvergenceFeature } from "@/lib/convergence-os/gates";
import { seedSyntheticPassportDoorwayLineage } from "@/lib/convergence-os/lineage/seed";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("lineage");
  if (gated) return gated;

  const [nodes, edges, chains] = await Promise.all([
    prisma.dataLineageNode.findMany({ orderBy: { nodeKey: "asc" } }),
    prisma.dataLineageEdge.findMany({ orderBy: { edgeKey: "asc" } }),
    prisma.authorityChain.findMany({
      include: { steps: { orderBy: { stepOrder: "asc" } } },
      orderBy: { chainKey: "asc" },
    }),
  ]);

  return jsonOk({
    nodes,
    edges,
    chains,
    syntheticOnly: true,
    note: "Fixture/synthetic lineage — no production participant data (C-018)",
  });
}

export async function POST() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("lineage");
  if (gated) return gated;

  const seeded = await seedSyntheticPassportDoorwayLineage();
  return jsonOk({ seeded, syntheticOnly: true });
}
