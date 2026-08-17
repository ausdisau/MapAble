export function AtRiskReasonPanel({
  items,
}: {
  items: { type: string; id: string; reason: string }[];
}) {
  if (items.length === 0) {
    return (
      <p role="status" className="text-muted-foreground">
        No at-risk items detected right now.
      </p>
    );
  }

  return (
    <ul className="space-y-3" aria-label="At-risk service items">
      {items.map((item) => (
        <li
          key={`${item.type}-${item.id}`}
          className="rounded-xl border border-amber-500/40 bg-amber-50 p-4 dark:bg-amber-950/30"
        >
          <p className="font-medium capitalize">{item.type} item</p>
          <p className="text-sm text-muted-foreground">ID: {item.id}</p>
          <p className="mt-2">{item.reason}</p>
        </li>
      ))}
    </ul>
  );
}
