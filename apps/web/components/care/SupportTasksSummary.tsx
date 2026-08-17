export function SupportTasksSummary({ tasks }: { tasks: unknown }) {
  const list = Array.isArray(tasks) ? tasks : [];
  if (list.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No support tasks listed.</p>
    );
  }
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {(list as { name?: string; intensity?: string }[]).map((t, i) => (
        <li key={i}>
          {t.name ?? "Support task"}
          {t.intensity === "high" ? (
            <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-900">
              High intensity
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
