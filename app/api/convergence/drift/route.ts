import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { requireConvergenceFeature } from "@/lib/platform/convergence-os/gates";
import { seedDriftFindings } from "@/lib/platform/convergence-os/ops/drift-parity-supply";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("drift");
  if (gated) return gated;

  const findings = await prisma.driftFinding.findMany({
    orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
  });
  return jsonOk({ findings, autoRemediate: false });
}

export async function POST() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("drift");
  if (gated) return gated;

  return jsonOk({
    ...(await seedDriftFindings()),
    autoRemediate: false,
  });
}
