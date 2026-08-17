export function BookingEventTimeline({
  events,
}: {
  events: {
    id: string;
    title: string;
    description: string | null;
    createdAt: string | Date;
    actor?: { name: string } | null;
  }[];
}) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground">No timeline events yet.</p>;
  }

  return (
    <ol className="space-y-3 border-l-2 border-border pl-6" aria-label="Booking activity timeline">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span className="absolute -left-[1.35rem] top-1 size-3 rounded-full bg-primary" aria-hidden="true" />
          <p className="font-medium">{event.title}</p>
          {event.description ? (
            <p className="text-sm text-muted-foreground">{event.description}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {new Date(event.createdAt).toLocaleString("en-AU")}
            {event.actor ? ` · ${event.actor.name}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
