import { cn } from "@/app/lib/utils";
import { mapableSectionCardClass } from "@/lib/brand/styles";

export type DisputeTimelineEvent = {
  id: string;
  label: string;
  body?: string | null;
  isInternal?: boolean;
  createdAt: string | Date;
  authorLabel?: string | null;
};

function formatWhen(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "Unknown time";
  return d.toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function DisputeTimeline({
  events,
  statusLabel,
  className,
}: {
  events: DisputeTimelineEvent[];
  statusLabel?: string;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="dispute-timeline-heading"
      className={cn(mapableSectionCardClass, "p-5", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="dispute-timeline-heading"
          className="text-lg font-black text-[#0C1833]"
        >
          Dispute timeline
        </h2>
        {statusLabel ? (
          <p className="text-sm font-semibold text-slate-700">
            Status: {statusLabel}
          </p>
        ) : null}
      </div>

      {events.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          No dispute activity recorded.
        </p>
      ) : (
        <ol className="relative mt-4 space-y-4 border-l-2 border-slate-300 pl-5">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span
                aria-hidden
                className="absolute -left-[1.4rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-slate-500"
              />
              <p className="font-semibold text-[#0C1833]">{event.label}</p>
              <p className="text-sm text-slate-600">
                {event.authorLabel ? `${event.authorLabel} · ` : null}
                {formatWhen(event.createdAt)}
                {event.isInternal ? " · Internal note" : null}
              </p>
              {event.body ? (
                <p className="mt-1 text-sm text-slate-700">{event.body}</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
