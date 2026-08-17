export function ContentSyncStatus({
  enabled,
  records,
}: {
  enabled: boolean;
  records: Array<{
    contentType: string;
    externalId: string;
    mapableSlug: string | null;
    status: string;
    lastSyncedAt: Date | null;
  }>;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm">Integration: {enabled ? "enabled" : "disabled"}</p>
      <ul className="space-y-2 text-sm">
        {records.map((r) => (
          <li key={`${r.contentType}-${r.externalId}`} className="rounded border px-3 py-2">
            {r.contentType} / {r.mapableSlug ?? r.externalId} — {r.status}
            {r.lastSyncedAt ? ` · ${r.lastSyncedAt.toLocaleString()}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
