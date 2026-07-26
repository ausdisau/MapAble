export function IncidentSeverityExplainer() {
  return (
    <aside className="rounded-lg border bg-muted/40 p-4 text-sm" aria-labelledby="severity-help">
      <h2 id="severity-help" className="font-semibold">
        Who can see this report?
      </h2>
      <p className="mt-2">
        MapAble staff will review your report. Your provider may see limited details
        if relevant to resolving the issue. We use plain language and trauma-aware
        processes. You are not in trouble for reporting a concern.
      </p>
    </aside>
  );
}
