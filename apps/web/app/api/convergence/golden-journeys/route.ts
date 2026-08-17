import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { requireConvergenceFeature } from "@/lib/platform/convergence-os/gates";
import { seedGoldenJourneys } from "@/lib/platform/convergence-os/ops/ownership-fitness-federation";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("goldenJourney");
  if (gated) return gated;

  const journeys = await prisma.goldenJourney.findMany({
    include: { steps: { orderBy: { stepOrder: "asc" } } },
    orderBy: { journeyKey: "asc" },
  });
  return jsonOk({ journeys });
}

export async function POST() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("goldenJourney");
  if (gated) return gated;

  return jsonOk(await seedGoldenJourneys());
}
