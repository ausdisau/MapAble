import { listPublishedNationalInsights } from "@/lib/research/national-insights/insights-service";

export default async function NationalInsightsPage() {
  const snapshots = await listPublishedNationalInsights();

  const glossary: Record<string, string> = {
    careCompleted: "Completed care shifts (aggregate)",
    transportCompleted: "Completed transport bookings",
    continuityAdjustedWeeks: "Weeks with planned support and no unplanned break",
    backupRecoverySuccessRate: "Backup recoveries reaching assigned/closed",
    reconciliationUnpaidPercent: "Unmatched reconciliation exceptions (Y2 metric)",
    trustPassportAdoptionRate: "Active workers with verified pilot credentials",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">National insights</h1>
      <p className="text-muted-foreground">
        Aggregate, suppressed metrics only. No participant-identifiable data.
      </p>

      <details className="rounded-lg border p-4 text-sm">
        <summary className="cursor-pointer font-medium">Metric glossary</summary>
        <dl className="mt-2 space-y-1">
          {Object.entries(glossary).map(([key, desc]) => (
            <div key={key}>
              <dt className="font-mono text-xs">{key}</dt>
              <dd className="text-muted-foreground">{desc}</dd>
            </div>
          ))}
        </dl>
      </details>

      <ul className="space-y-4">
        {snapshots.map((s) => (
          <li key={s.id} className="rounded-lg border p-4">
            <h2 className="font-medium">{s.periodLabel}</h2>
            {s.suppressed ? (
              <p className="text-sm text-amber-800">
                Some metrics suppressed (small cell)
              </p>
            ) : null}
            <pre className="mt-2 overflow-x-auto text-xs">
              {JSON.stringify(s.metricsJson, null, 2)}
            </pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
