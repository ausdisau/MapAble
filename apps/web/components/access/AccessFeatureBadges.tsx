export function AccessFeatureBadges({ features }: { features: string[] }) {
  if (!features.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Accessibility information unknown for features.
      </p>
    );
  }
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Access features">
      {features.map((f) => (
        <li
          key={f}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium capitalize"
        >
          {f.replace(/_/g, " ")}
        </li>
      ))}
    </ul>
  );
}
