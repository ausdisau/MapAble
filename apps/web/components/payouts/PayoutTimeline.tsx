type TimelineEvent = {
  id: string;
  label: string;
  detail?: string;
  at: string;
};

export function PayoutTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <section aria-labelledby="payout-timeline-heading">
      <h2 id="payout-timeline-heading" className="text-lg font-semibold">
        Payout timeline
      </h2>
      <ol className="mt-4 space-y-4 border-l-2 pl-4">
        {events.map((event) => (
          <li key={event.id}>
            <p className="font-medium">{event.label}</p>
            {event.detail ? <p className="text-sm">{event.detail}</p> : null}
            <time className="text-xs text-muted-foreground" dateTime={event.at}>
              {new Date(event.at).toLocaleString("en-AU")}
            </time>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm">
        Transfer created means MapAble has moved funds to your Stripe connected account. Bank arrival
        timing depends on Stripe and your payout schedule.
      </p>
    </section>
  );
}
