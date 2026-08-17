export function BillingPreflightPanel({
  status,
  failedReasons,
}: {
  status: string;
  failedReasons?: string[];
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-semibold">Billing preflight</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Preflight checks invoice data before approval. It does not verify NDIS
        budget or eligibility.
      </p>
      <p className="mt-3 font-medium">
        Result: {status === "passed" ? "Passed" : "Failed"}
      </p>
      {failedReasons?.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
          {failedReasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
