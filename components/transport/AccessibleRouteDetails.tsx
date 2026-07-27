import type { AccessibleRouteDetails } from "@/lib/transport/public-transit/types";

export function AccessibleRouteDetailsPanel({
  details,
}: {
  details: AccessibleRouteDetails | null;
}) {
  if (!details) {
    return (
      <section className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground" role="status">
          Accessible route details are not available. Enable public transit adapters or
          use a non-live trip plan.
        </p>
      </section>
    );
  }

  return (
    <section
      className="rounded-xl border border-border bg-card p-4"
      aria-labelledby="accessible-route-heading"
    >
      <h2 id="accessible-route-heading" className="font-semibold">
        Accessible route details
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Advisory only · Source: {details.source.label}
        {details.source.isLive ? " (live)" : " (static)"} · fetched{" "}
        {new Date(details.source.fetchedAt).toLocaleString("en-AU")}
      </p>
      <ol className="mt-3 space-y-2">
        {details.segments.map((seg, index) => (
          <li key={`${seg.mode}-${index}`} className="rounded border p-2 text-sm">
            <p className="font-medium capitalize">{seg.mode}</p>
            <p>
              {seg.from} → {seg.to}
            </p>
            <p className="text-muted-foreground">
              Wheelchair access: {seg.wheelchairAccessible.replace(/_/g, " ")}
            </p>
            <p className="text-xs text-muted-foreground">Evidence: {seg.evidenceSource}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
