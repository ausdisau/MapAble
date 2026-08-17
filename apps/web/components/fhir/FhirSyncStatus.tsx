export function FhirSyncStatus({
  events,
}: {
  events: Array<{ eventType: string; status: string; createdAt: Date }>;
}) {
  return (
    <ul className="space-y-1 text-sm">
      {events.map((e, i) => (
        <li key={i}>
          {e.eventType} — {e.status} ({e.createdAt.toLocaleString()})
        </li>
      ))}
    </ul>
  );
}
