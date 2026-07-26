import { CoreHubCard } from "@/components/core/CoreHubCard";
import { ProviderSectionNav } from "@/components/provider/ProviderSectionNav";
import { PROVIDER_INSIGHTS_LINKS } from "@/lib/platform/core-ui/provider-section-nav";

export const metadata = { title: "Insights | MapAble Provider" };

export default function ProviderInsightsHubPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Insights</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Benchmarks, operational reports, and capacity tracking for your organisation.
        </p>
      </header>

      <ProviderSectionNav links={PROVIDER_INSIGHTS_LINKS} ariaLabel="Insights sections" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CoreHubCard
          href="/provider/benchmarks"
          title="Benchmarks"
          description="Safeguarded organisation performance snapshots"
        />
        <CoreHubCard
          href="/provider/reports"
          title="Reports"
          description="Organisation dashboards when analytics is configured"
        />
        <CoreHubCard
          href="/provider/capacity"
          title="Capacity"
          description="Service capacity blocks and utilisation warnings"
        />
      </div>
    </div>
  );
}
