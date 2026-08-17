export function AccessNeedsSummary({
  summary,
  needs,
}: {
  summary?: string | null;
  needs?: { category: string; summary: string }[];
}) {
  if (!summary && (!needs || needs.length === 0)) {
    return (
      <p className="text-sm text-muted-foreground">
        No access needs recorded for this booking.
      </p>
    );
  }
  return (
    <section aria-labelledby="access-needs-heading" className="space-y-2">
      <h2 id="access-needs-heading" className="text-sm font-semibold">
        Access needs
      </h2>
      {summary ? <p className="text-sm">{summary}</p> : null}
      {needs?.length ? (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {needs.map((n) => (
            <li key={`${n.category}-${n.summary}`}>
              <span className="font-medium">{n.category}:</span> {n.summary}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
