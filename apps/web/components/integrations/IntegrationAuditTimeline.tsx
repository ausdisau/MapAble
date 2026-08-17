export function IntegrationAuditTimeline({
  events,
}: {
  events: Array<{
    id: string;
    integrationKey: string;
    displayName: string;
    eventType: string;
    severity: string;
    message: string | null;
    createdAt: string;
  }>;
}) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No integration events yet.</p>
    );
  }

  return (
    <ol className="space-y-3" aria-label="Integration audit timeline">
      {events.map((event) => (
        <li
          key={event.id}
          className="rounded-md border border-l-4 border-l-primary/40 px-4 py-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-medium">{event.eventType}</span>
            <time className="text-xs text-muted-foreground" dateTime={event.createdAt}>
              {new Date(event.createdAt).toLocaleString()}
            </time>
          </div>
          <p className="text-sm text-muted-foreground">
            {event.displayName} ({event.integrationKey}) · {event.severity}
          </p>
          {event.message ? (
            <p className="mt-1 text-sm">{event.message}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
