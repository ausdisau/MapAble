import { AnalyticsPrivacyNotice } from "@/components/analytics/AnalyticsPrivacyNotice";
import { AnalyticsCloudStatus } from "@/components/analytics/MetricSnapshotCard";
import { EvaluationHarnessPanel } from "@/components/analytics/EvaluationHarnessPanel";
import { ResearchGovernanceNotice } from "@/components/analytics/ResearchGovernanceNotice";
import { DeidentificationBadge } from "@/components/data-governance/DeidentificationBadge";
import { requireAdmin } from "@/lib/auth/guards";
import { isMetabaseEnabled } from "@/lib/analytics/metabase/metabase-client";
import { listPublishedMetrics } from "@/lib/platform/analytics/metric-registry";
import { listAnalyticsExports } from "@/lib/platform/privacy/exports";
import { listResearchProjects } from "@/lib/research";

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  const [{ disabled: metricsDisabled, metrics }, exportResult, researchResult] =
    await Promise.all([
      listPublishedMetrics(),
      listAnalyticsExports(5),
      listResearchProjects(5),
    ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Analytics &amp; Research</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Privacy-preserving analytics cloud, research governance, and AI evaluation.
        </p>
      </header>

      <DeidentificationBadge />
      <AnalyticsPrivacyNotice />
      <AnalyticsCloudStatus />

      <p className="text-sm">
        Metabase: {isMetabaseEnabled() ? "enabled" : "disabled — set METABASE_ENABLED=true"}
      </p>

      <section aria-labelledby="metrics-registry-heading" className="space-y-3">
        <h2 id="metrics-registry-heading" className="font-heading text-lg font-semibold">
          Metric registry
        </h2>
        {metricsDisabled ? (
          <p className="text-sm text-muted-foreground">Analytics cloud disabled.</p>
        ) : metrics.length === 0 ? (
          <p className="text-sm text-muted-foreground">No published metrics yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {metrics.map((m) => (
              <li key={m.id} className="px-4 py-3 text-sm">
                <span className="font-medium">{m.name}</span>
                <span className="ml-2 text-muted-foreground">({m.key})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recent-exports-heading" className="space-y-3">
        <h2 id="recent-exports-heading" className="font-heading text-lg font-semibold">
          Recent analytics exports
        </h2>
        {exportResult.disabled ? (
          <p className="text-sm text-muted-foreground">Exports unavailable.</p>
        ) : exportResult.exports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No exports yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {exportResult.exports.map((e) => (
              <li key={e.id} className="px-4 py-3 text-sm flex justify-between">
                <span>{e.exportLabel}</span>
                <span className="text-muted-foreground">{e.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ResearchGovernanceNotice />

      <section aria-labelledby="research-projects-heading" className="space-y-3">
        <h2 id="research-projects-heading" className="font-heading text-lg font-semibold">
          Research projects
        </h2>
        {researchResult.disabled ? (
          <p className="text-sm text-muted-foreground">Research governance disabled.</p>
        ) : researchResult.projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {researchResult.projects.map((p) => (
              <li key={p.id} className="px-4 py-3 text-sm flex justify-between">
                <span>{p.title}</span>
                <span className="text-muted-foreground">{p.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <EvaluationHarnessPanel />
    </div>
  );
}
