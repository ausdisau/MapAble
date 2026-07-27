type DecisionRow = {
  id: string;
  domain: string;
  action: string;
  decision: string;
  reason: string;
  purpose: string | null;
  createdAt: string;
};

export function AuthoritySummary({ decisions }: { decisions: DecisionRow[] }) {
  const allowed = decisions.filter((d) => d.decision === "allow").length;
  const denied = decisions.filter((d) => d.decision === "deny").length;
  const recent = decisions.slice(0, 5);

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-3">
          <dt className="text-xs font-medium text-muted-foreground">
            Total decisions
          </dt>
          <dd className="text-2xl font-bold">{decisions.length}</dd>
        </div>
        <div className="rounded-lg border p-3">
          <dt className="text-xs font-medium text-muted-foreground">Allowed</dt>
          <dd className="text-2xl font-bold text-green-700">{allowed}</dd>
        </div>
        <div className="rounded-lg border p-3">
          <dt className="text-xs font-medium text-muted-foreground">Denied</dt>
          <dd className="text-2xl font-bold text-destructive">{denied}</dd>
        </div>
      </dl>

      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No authority decisions recorded yet.
        </p>
      ) : (
        <div>
          <h3 className="text-sm font-semibold">Recent decisions</h3>
          <ul className="mt-2 divide-y rounded-lg border">
            {recent.map((decision) => (
              <li key={decision.id} className="p-3 text-sm">
                <p className="font-medium">
                  {decision.domain.replace(/_/g, " ")} · {decision.action}
                </p>
                <p className="text-muted-foreground">
                  {decision.decision === "allow" ? "Allowed" : "Denied"} —{" "}
                  {decision.reason.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(decision.createdAt).toLocaleString("en-AU")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
