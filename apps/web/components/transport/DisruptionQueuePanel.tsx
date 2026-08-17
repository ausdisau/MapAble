type DisruptionItem = {
  id: string;
  kind: string;
  status: string;
  title: string;
  description?: string | null;
  source: string;
  sourceFreshnessAt?: Date | string | null;
  createdAt: Date | string;
};

export function DisruptionQueuePanel({
  disruptions,
}: {
  disruptions: DisruptionItem[];
}) {
  return (
    <section
      className="rounded-xl border border-border bg-card p-4"
      aria-labelledby="disruption-queue-heading"
    >
      <h2 id="disruption-queue-heading" className="font-semibold">
        Disruption queue
      </h2>
      {disruptions.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          No open disruptions.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {disruptions.map((d) => (
            <li key={d.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{d.title}</p>
              <p className="text-muted-foreground">
                {d.kind.replace(/_/g, " ")} · {d.status.replace(/_/g, " ")}
              </p>
              {d.description ? (
                <p className="mt-1">{d.description}</p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                Source: {d.source}
                {d.sourceFreshnessAt
                  ? ` · refreshed ${new Date(d.sourceFreshnessAt).toLocaleString("en-AU")}`
                  : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
