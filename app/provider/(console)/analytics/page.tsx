import Link from "next/link";

import { AnalyticsPrivacyNotice } from "@/components/analytics/AnalyticsPrivacyNotice";
import { AnalyticsCloudStatus } from "@/components/analytics/MetricSnapshotCard";
import { MetricSnapshotCard } from "@/components/analytics/MetricSnapshotCard";
import { ProviderSectionNav } from "@/components/provider/ProviderSectionNav";
import { requireAuth } from "@/lib/auth/guards";
import { listPublishedMetrics } from "@/lib/platform/analytics/metric-registry";
import { PROVIDER_INSIGHTS_LINKS } from "@/lib/core-ui/provider-section-nav";

export const metadata = { title: "Analytics | MapAble Provider" };

export default async function ProviderAnalyticsPage() {
  await requireAuth();

  const { disabled, metrics } = await listPublishedMetrics();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Analytics</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Organisation-level metrics with privacy-preserving aggregation and small-cell
          suppression.
        </p>
      </header>

      <ProviderSectionNav links={PROVIDER_INSIGHTS_LINKS} ariaLabel="Insights sections" />

      <AnalyticsPrivacyNotice />
      <AnalyticsCloudStatus />

      {disabled ? (
        <p className="text-sm text-muted-foreground" role="status">
          Analytics cloud is disabled for this environment.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.slice(0, 6).map((m) => (
            <MetricSnapshotCard
              key={m.id}
              name={m.name}
              value={null}
              unit={m.unit}
              deidentificationLevel="aggregated"
            />
          ))}
        </div>
      )}

      <p className="text-sm">
        <Link href="/provider/reports" className="underline">
          View operational reports
        </Link>
      </p>
    </div>
  );
}
