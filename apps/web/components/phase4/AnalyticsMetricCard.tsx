export function AnalyticsMetricCard({
  title,
  value,
  definition,
}: {
  title: string;
  value: number;
  definition: string;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-medium capitalize">{title.replace(/([A-Z])/g, " $1")}</h3>
      <p className="mt-2 text-3xl font-bold tabular-nums" aria-live="polite">
        {value}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{definition}</p>
    </article>
  );
}
