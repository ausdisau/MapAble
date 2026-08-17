import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getTrustPassportPilotMetrics, isTrustPassportPilotEnabled } from "@/lib/trust/passport/trust-passport-service";

export default async function AdminWorkersTrustPassportPage() {
  await requireAdmin();

  const metrics = isTrustPassportPilotEnabled()
    ? await getTrustPassportPilotMetrics()
    : null;

  const workers = await prisma.workerProfile.findMany({
    where: { active: true },
    take: 10,
    select: { id: true, displayName: true, verificationStatus: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Workers — trust passport pilot</h1>

      {metrics ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Adoption</p>
            <p className="text-2xl font-bold">{metrics.adoptionPercent.toFixed(1)}%</p>
            {metrics.killCriteriaBreached ? (
              <p className="text-xs text-amber-800">Below 20% pilot target</p>
            ) : null}
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Reuse rate</p>
            <p className="text-2xl font-bold">{metrics.reuseRate.toFixed(1)}%</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Cohort size</p>
            <p className="text-2xl font-bold">{metrics.pilotCohortSize}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Trust passport pilot disabled.</p>
      )}

      <Link
        href="/dashboard/worker/trust-passport"
        className="text-sm text-primary underline"
      >
        Worker trust passport UI
      </Link>

      <ul className="space-y-2">
        {workers.map((w) => (
          <li key={w.id} className="rounded border p-2 text-sm">
            {w.displayName} — {w.verificationStatus}
          </li>
        ))}
      </ul>
    </div>
  );
}
