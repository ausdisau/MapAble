import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { requireConvergenceFeature } from "@/lib/convergence-os/gates";
import { seedOwnershipRegistry } from "@/lib/convergence-os/ops/ownership-fitness-federation";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("ownership");
  if (gated) return gated;

  const [records, gaps, fitness, fitnessResults] = await Promise.all([
    prisma.ownershipRecord.findMany({ orderBy: { subjectKey: "asc" } }),
    prisma.ownershipGapFinding.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.architectureFitnessFunction.findMany({
      orderBy: { fitnessKey: "asc" },
    }),
    prisma.fitnessFunctionResult.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  return jsonOk({ records, gaps, fitness, fitnessResults });
}

export async function POST() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("ownership");
  if (gated) return gated;

  return jsonOk(await seedOwnershipRegistry());
}
