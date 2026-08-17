
export interface AuditEventRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  participantId: string | null;
  createdAt: string | Date;
  actorUser?: { name: string; email: string } | null;
}

export function AuditEventTable({ events }: { events: AuditEventRow[] }) {
  if (!events.length) {
    return <p className="text-muted-foreground">No audit events found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Audit events</caption>
        <thead className="bg-muted/50">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              When
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Action
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Entity
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Actor
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-t border-border">
              <td className="px-4 py-3 whitespace-nowrap">
                {new Date(event.createdAt).toLocaleString("en-AU")}
              </td>
              <td className="px-4 py-3">
                <code className="text-xs">{event.action}</code>
              </td>
              <td className="px-4 py-3">
                {event.entityType}
                {event.entityId ? ` (${event.entityId.slice(0, 8)}…)` : ""}
              </td>
              <td className="px-4 py-3">
                {event.actorUser?.name ?? "System"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
