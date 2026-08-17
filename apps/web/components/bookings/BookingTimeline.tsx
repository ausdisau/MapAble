import { StatusBadge } from "@/components/ui/status-badge";

export interface TimelineSegment {
  id: string;
  segmentType: string;
  startTime: string | Date | null;
  endTime: string | Date | null;
  pickupAddress?: string | null;
  dropoffAddress?: string | null;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  sortOrder: number;
}

function formatTime(value: string | Date | null) {
  if (!value) return "Time not set";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const SEGMENT_LABELS: Record<string, string> = {
  care: "Care support",
  outbound_transport: "Outbound transport",
  return_transport: "Return transport",
  transport: "Transport",
};

export function BookingTimeline({
  segments,
  bookingType,
}: {
  segments: TimelineSegment[];
  bookingType: string;
}) {
  if (!segments.length && bookingType !== "care_transport") {
    return null;
  }

  const sorted = [...segments].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <ol className="relative space-y-4 border-l-2 border-border pl-6" aria-label="Booking timeline">
      {sorted.map((segment, index) => (
        <li key={segment.id} className="relative">
          <span
            className="absolute -left-[1.6rem] top-1 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
            aria-hidden="true"
          >
            {index + 1}
          </span>
          <div className="rounded-lg border border-border bg-card p-3">
            <h4 className="font-medium">
              {SEGMENT_LABELS[segment.segmentType] ?? segment.segmentType}
            </h4>
            <p className="text-sm text-muted-foreground">
              {formatTime(segment.startTime)}
              {segment.endTime ? ` – ${formatTime(segment.endTime)}` : ""}
            </p>
            {segment.pickupAddress ? (
              <p className="mt-1 text-sm">
                <span className="font-medium">Pickup:</span>{" "}
                {segment.pickupAddress}
              </p>
            ) : null}
            {segment.dropoffAddress ? (
              <p className="text-sm">
                <span className="font-medium">Drop-off:</span>{" "}
                {segment.dropoffAddress}
              </p>
            ) : null}
            {(segment.bufferBeforeMinutes ?? 0) > 0 ||
            (segment.bufferAfterMinutes ?? 0) > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Buffer: {segment.bufferBeforeMinutes ?? 0} min before,{" "}
                {segment.bufferAfterMinutes ?? 0} min after
              </p>
            ) : null}
          </div>
        </li>
      ))}
      {bookingType === "care_transport" && sorted.length === 0 ? (
        <li>
          <p className="text-sm text-muted-foreground">
            Linked care and transport booking — add segment times in admin if
            needed.
          </p>
        </li>
      ) : null}
    </ol>
  );
}

export function BookingStatusPanel({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Status</span>
      <StatusBadge status={status} />
    </div>
  );
}
