import { requireAuth } from "@/lib/auth/guards";
import { BENCHMARK_DISCLAIMER } from "@/lib/config/y4-civic-platform";
import { prisma } from "@/lib/prisma";
import { getSafeguardedBenchmarksForOrg } from "@/lib/provider/benchmarking/benchmark-service";

export default async function ProviderBenchmarksPage() {
  const user = await requireAuth();
  const membership = await prisma.organisationMember.findFirst({
    where: { userId: user.id },
    select: { organisationId: true },
  });

  const orgId = membership?.organisationId;
  const data = orgId
    ? await getSafeguardedBenchmarksForOrg(orgId)
    : { disabled: true, snapshots: [], disclaimer: BENCHMARK_DISCLAIMER };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Organisation benchmarks</h1>
      <p className="text-sm text-muted-foreground">{data.disclaimer}</p>
      {data.disabled ? (
        <p className="text-sm">
          Safeguarded benchmarks are unavailable — enable PROVIDER_BENCHMARKING_V2_ENABLED
          and link to an organisation.
        </p>
      ) : (
        <ul className="space-y-2">
          {data.snapshots.map((s, i) => (
            <li key={`${s.metricKey}-${i}`} className="rounded border p-3 text-sm">
              {s.metricKey} —{" "}
              {s.suppressed ? "suppressed (small cohort)" : s.displayValue} ({s.periodLabel})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
