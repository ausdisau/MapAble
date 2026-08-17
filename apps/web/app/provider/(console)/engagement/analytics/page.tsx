import Link from "next/link";

import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { getProviderOrganisationIds } from "@/lib/engagement/engagement-access";
import {
  getCsatAverage,
  getOrgBenchmarkComparison,
} from "@/lib/engagement/nps-service";

export const metadata = { title: "Engagement analytics | Provider" };

export default async function ProviderEngagementAnalyticsPage() {
  const user = await requireAuth();
  await requirePermission("engagement:provider:read");

  if (!isEngagementPlatformEnabled()) {
    return <p>Engagement platform is disabled.</p>;
  }

  const orgIds = await getProviderOrganisationIds(user.id);
  const orgId = orgIds[0];
  if (!orgId) return <p>No organisation linked.</p>;

  const since = new Date();
  since.setMonth(since.getMonth() - 3);

  const [benchmark, csat] = await Promise.all([
    getOrgBenchmarkComparison(orgId),
    getCsatAverage(orgId, since),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/provider/engagement" className="text-sm text-primary hover:underline">
          ← Engagement
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">Benchmarking</h1>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Your NPS (3 months)</p>
          <p className="mt-2 text-3xl font-bold">
            {benchmark.org.suppressed
              ? "Suppressed"
              : benchmark.org.nps ?? "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Platform median:{" "}
            {benchmark.platformMedian.suppressed
              ? "Suppressed"
              : benchmark.platformMedian.nps ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">CSAT average</p>
          <p className="mt-2 text-3xl font-bold">
            {csat.suppressed ? "Suppressed" : csat.average !== null ? `${csat.average}/5` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
