export function VehicleSuitabilityWarning({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-600 bg-amber-50 p-4 dark:bg-amber-950/40"
    >
      <h3 className="font-semibold">Vehicle suitability</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {warnings.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
    </div>
  );
}
