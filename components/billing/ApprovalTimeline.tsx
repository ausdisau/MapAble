import { cn } from "@/app/lib/utils";
import { mapableSectionCardClass } from "@/lib/brand/styles";

export type ApprovalTimelineEvent = {
  id: string;
  approvalType: string;
  decision: string;
  actorRole?: string | null;
  reason?: string | null;
  decidedAt?: string | Date | null;
  createdAt: string | Date;
};

function formatWhen(value: string | Date | null | undefined): string {
  if (!value) return "Pending";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "Pending";
  return d.toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ApprovalTimeline({
  events,
  className,
}: {
  events: ApprovalTimelineEvent[];
  className?: string;
}) {
  return (
    <section
      aria-labelledby="approval-timeline-heading"
      className={cn(mapableSectionCardClass, "p-5", className)}
    >
      <h2
        id="approval-timeline-heading"
        className="text-lg font-black text-[#0C1833]"
      >
        Approval timeline
      </h2>

      {events.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          No approval steps recorded yet.
        </p>
      ) : (
        <ol className="relative mt-4 space-y-4 border-l-2 border-[#005B7F]/30 pl-5">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span
                aria-hidden
                className="absolute -left-[1.4rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-[#005B7F]"
              />
              <p className="font-semibold text-[#0C1833]">
                {event.approvalType.replace(/_/g, " ")} —{" "}
                <span className="capitalize">
                  {event.decision.replace(/_/g, " ")}
                </span>
              </p>
              <p className="text-sm text-slate-600">
                {event.actorRole
                  ? `By ${event.actorRole.replace(/_/g, " ")} · `
                  : null}
                {formatWhen(event.decidedAt ?? event.createdAt)}
              </p>
              {event.reason ? (
                <p className="mt-1 text-sm text-slate-700">{event.reason}</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
