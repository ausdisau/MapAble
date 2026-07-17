import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  runBlastSimulation,
  seedCounterfactualSimulations,
  type BlastSimulationInput,
} from "@/lib/convergence-os/blast/simulator";
import { requireConvergenceFeature } from "@/lib/convergence-os/gates";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("blastRadius");
  if (gated) return gated;

  const simulations = await prisma.blastRadiusSimulation.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return jsonOk({ simulations });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("blastRadius");
  if (gated) return gated;

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    simulation?: BlastSimulationInput;
  };

  if (body.action === "seed_counterfactuals") {
    const results = await seedCounterfactualSimulations();
    return jsonOk({ results, note: "AI cannot lower final severity" });
  }

  if (body.action === "simulate" && body.simulation) {
    const result = await runBlastSimulation(body.simulation);
    return jsonOk({ result });
  }

  return jsonError("Unknown action. Use seed_counterfactuals | simulate", 400);
}
