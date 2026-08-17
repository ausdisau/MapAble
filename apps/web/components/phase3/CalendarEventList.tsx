import type { CalendarEvent } from "@prisma/client";

export function CalendarEventList({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) {
    return (
      <p role="status" className="text-muted-foreground">
        No upcoming events in this period.
      </p>
    );
  }

  return (
    <ol className="space-y-3" aria-label="Calendar events">
      {events.map((event) => (
        <li key={event.id}>
          <article className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-medium">{event.title}</h3>
            <p className="text-sm text-muted-foreground">
              <time dateTime={event.startAt.toISOString()}>
                {event.startAt.toLocaleString("en-AU", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </time>
              {" — "}
              <time dateTime={event.endAt.toISOString()}>
                {event.endAt.toLocaleString("en-AU", {
                  timeStyle: "short",
                })}
              </time>
            </p>
            <p className="mt-1 text-sm">
              <span className="font-medium">Type: </span>
              {event.eventType.replace(/_/g, " ")}
            </p>
            {event.description ? (
              <p className="mt-2 text-sm">{event.description}</p>
            ) : null}
          </article>
        </li>
      ))}
    </ol>
  );
}
