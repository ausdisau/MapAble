export function WorkflowRunTimeline({
  events,
  deadlines,
}: {
  events: Array<{ eventType: string; createdAt: Date }>;
  deadlines: Array<{ label: string; deadlineAt: Date; metAt: Date | null }>;
}) {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="font-medium">Events</h3>
        <ol className="mt-2 space-y-1 text-sm">
          {events.map((e, i) => (
            <li key={i}>
              {e.eventType} — {e.createdAt.toLocaleString()}
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h3 className="font-medium">Deadlines</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {deadlines.map((d, i) => (
            <li key={i}>
              {d.label}: due {d.deadlineAt.toLocaleString()}
              {d.metAt ? " (met)" : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
