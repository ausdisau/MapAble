export interface CaseloadCaseSummary {
  id: string;
  title: string;
  status: string;
  operationalPriority: string;
  participantName: string;
  openTaskCount: number;
  waitingOnTaskCount: number;
}

interface CaseloadDashboardProps {
  cases: CaseloadCaseSummary[];
  enabled: boolean;
}

const PRIORITY_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export function CaseloadDashboard({ cases, enabled }: CaseloadDashboardProps) {
  if (!enabled) {
    return (
      <section aria-labelledby="caseload-heading" className="rounded-lg border p-4">
        <h2 id="caseload-heading" className="font-heading text-lg font-semibold">
          Caseload
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Support coordination caseload is not enabled in this environment.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="caseload-heading" className="space-y-4">
      <h2 id="caseload-heading" className="font-heading text-lg font-semibold">
        Caseload ({cases.length})
      </h2>
      {cases.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No open coordination cases. Create a case when you begin work with a
          participant.
        </p>
      ) : (
        <ul className="grid gap-3">
          {cases.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border p-4"
              aria-label={`Case: ${c.title}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {c.participantName}
                  </p>
                </div>
                <span
                  className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
                  aria-label={`Operational priority: ${PRIORITY_LABEL[c.operationalPriority] ?? c.operationalPriority}`}
                >
                  {PRIORITY_LABEL[c.operationalPriority] ?? c.operationalPriority}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium capitalize">{c.status.replace("_", " ")}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Open tasks</dt>
                  <dd className="font-medium">{c.openTaskCount}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Waiting on</dt>
                  <dd className="font-medium">
                    {c.waitingOnTaskCount > 0
                      ? `${c.waitingOnTaskCount} blocked`
                      : "None"}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
