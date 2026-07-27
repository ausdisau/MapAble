type RecoveryOption = {
  id: string;
  label: string;
  description: string;
  evidenceSummary?: string | null;
  isLiveData: boolean;
  nonLiveAlternative: boolean;
};

type RecoveryRequest = {
  id: string;
  trigger: string;
  status: string;
  expiresAt?: Date | string | null;
  options: RecoveryOption[];
};

export function ContinuityRecoveryPanel({
  recoveries,
}: {
  recoveries: RecoveryRequest[];
}) {
  return (
    <section
      className="rounded-xl border border-border bg-card p-4"
      aria-labelledby="continuity-recovery-heading"
    >
      <h2 id="continuity-recovery-heading" className="font-semibold">
        Continuity recovery
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Recovery options require your explicit confirmation. MapAble will never silently
        substitute a vehicle or provider.
      </p>
      {recoveries.length === 0 ? (
        <p className="mt-3 text-sm" role="status">
          No recovery options pending.
        </p>
      ) : (
        <ul className="mt-3 space-y-4">
          {recoveries.map((req) => (
            <li key={req.id} className="rounded-lg border border-border p-3">
              <p className="font-medium">
                {req.trigger.replace(/_/g, " ")} — {req.status.replace(/_/g, " ")}
              </p>
              {req.expiresAt ? (
                <p className="text-xs text-muted-foreground">
                  Expires {new Date(req.expiresAt).toLocaleString("en-AU")}
                </p>
              ) : null}
              <ul className="mt-2 space-y-2">
                {req.options.map((opt) => (
                  <li key={opt.id} className="rounded border border-dashed p-2 text-sm">
                    <p className="font-medium">{opt.label}</p>
                    <p>{opt.description}</p>
                    {opt.evidenceSummary ? (
                      <p className="text-xs text-muted-foreground">
                        Evidence: {opt.evidenceSummary}
                      </p>
                    ) : null}
                    {opt.isLiveData && opt.nonLiveAlternative ? (
                      <p className="text-xs text-muted-foreground">
                        Live data shown — a non-live accessible alternative is available if
                        this option is unavailable.
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
