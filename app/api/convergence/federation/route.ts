import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { requireConvergenceFeature } from "@/lib/platform/convergence-os/gates";
import { seedFederation } from "@/lib/platform/convergence-os/ops/ownership-fitness-federation";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("federation");
  if (gated) return gated;

  const [repos, complexity, runtime] = await Promise.all([
    prisma.federatedRepository.findMany({
      include: { contracts: true },
      orderBy: { repoKey: "asc" },
    }),
    prisma.complexityBudgetSnapshot.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.runtimeComponent.findMany({ orderBy: { componentKey: "asc" } }),
  ]);
  return jsonOk({
    repos,
    complexity,
    runtime,
    mutatesRemotes: false,
    note: "Federation is read-only by default (C-024)",
  });
}

export async function POST() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("federation");
  if (gated) return gated;

  return jsonOk({
    ...(await seedFederation()),
    mutatesRemotes: false,
  });
}
