import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { requireConvergenceFeature } from "@/lib/convergence-os/gates";
import { seedSupplyChain } from "@/lib/convergence-os/ops/drift-parity-supply";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("supplyChain");
  if (gated) return gated;

  const dependencies = await prisma.supplyChainDependency.findMany({
    orderBy: { packageName: "asc" },
  });
  return jsonOk({ dependencies });
}

export async function POST() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("supplyChain");
  if (gated) return gated;

  return jsonOk(await seedSupplyChain());
}
