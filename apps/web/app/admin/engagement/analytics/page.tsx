import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import {
  getCsatAverage,
  getPlatformNpsBenchmark,
} from "@/lib/engagement/nps-service";

export const metadata = { title: "Engagement analytics | Admin" };

export default async function AdminEngagementAnalyticsPage() {
  await requirePermission("engagement:manage:any");

  if (!isEngagementPlatformEnabled()) {
    return <p>Engagement platform is disabled.</p>;
  }

  const since = new Date();
  since.setMonth(since.getMonth() - 3);

  const [nps, csat] = await Promise.all([
    getPlatformNpsBenchmark(since),
    getCsatAverage(undefined, since),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/engagement" className="text-sm text-primary hover:underline">
          ← Engagement triage
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">
          NPS &amp; benchmarking
        </h1>
        <p className="text-sm text-muted-foreground">
          Last 3 months. Small cohorts are suppressed for privacy.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          title="Platform NPS"
          value={
            nps.suppressed
              ? "Suppressed (small cohort)"
              : nps.nps !== null
                ? String(nps.nps)
                : "—"
          }
          detail={`${nps.total} responses`}
        />
        <MetricCard
          title="Average CSAT"
          value={
            csat.suppressed
              ? "Suppressed"
              : csat.average !== null
                ? `${csat.average}/5`
                : "—"
          }
          detail={`${csat.count} ratings`}
        />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
