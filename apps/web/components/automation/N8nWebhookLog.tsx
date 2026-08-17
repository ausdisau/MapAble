export function N8nWebhookLog({
  events,
}: {
  events: Array<{ eventKey: string; status: string; receivedAt: Date }>;
}) {
  return (
    <ul className="space-y-1 text-sm">
      {events.map((e, i) => (
        <li key={i}>
          {e.eventKey} — {e.status} ({e.receivedAt.toLocaleString()})
        </li>
      ))}
    </ul>
  );
}
