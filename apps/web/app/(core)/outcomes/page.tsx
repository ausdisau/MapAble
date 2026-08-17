import {
  getOutcomesDisclaimer,
  listPublishedOutcomesByWave,
} from "@/lib/research/long-term-outcomes/outcomes-service";

export default async function OutcomesPage() {
  const waves = await listPublishedOutcomesByWave();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Long-term outcomes</h1>
      <p className="text-muted-foreground">
        Published outcome snapshots — suppressed when cohorts are too small.
      </p>
      <p className="text-xs text-muted-foreground">{getOutcomesDisclaimer()}</p>
      {waves.map(({ waveLabel, items }) => (
        <section key={waveLabel} className="space-y-3">
          <h2 className="font-medium">Wave: {waveLabel}</h2>
          <ul className="space-y-3">
            {items.map((o) => (
              <li key={o.id} className="rounded-lg border p-4">
                <strong>{o.outcomeKey}</strong>
                <span className="ml-2 text-sm">({o.periodLabel})</span>
                <p className="text-sm">
                  {o.suppressed ? "Suppressed (small cohort)" : o.value ?? "n/a"}
                </p>
                {o.continuityMetricKey ? (
                  <p className="text-xs text-muted-foreground">
                    Continuity metric: {o.continuityMetricKey}
                  </p>
                ) : null}
                {o.narrative ? (
                  <p className="text-xs text-muted-foreground">{o.narrative}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
