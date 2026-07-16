import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { requireConvergenceFeature } from "@/lib/convergence-os/gates";
import { seedEnvironmentParity } from "@/lib/convergence-os/ops/drift-parity-supply";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("envParity");
  if (gated) return gated;

  const [environments, secrets] = await Promise.all([
    prisma.environmentParityRecord.findMany({
      orderBy: { environmentKey: "asc" },
    }),
    prisma.secretContract.findMany({ orderBy: { secretName: "asc" } }),
  ]);
  return jsonOk({
    environments,
    secrets,
    note: "Secret presence only — values never stored",
  });
}

export async function POST() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("envParity");
  if (gated) return gated;

  return jsonOk(await seedEnvironmentParity());
}
