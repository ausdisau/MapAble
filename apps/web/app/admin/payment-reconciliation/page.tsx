import { requireAdmin } from "@/lib/auth/guards";
import { getReconciliationDashboard } from "@/lib/billing/payment-reconciliation/reconciliation-service";

export default async function PaymentReconciliationPage() {
  await requireAdmin();
  const { batches, metrics } = await getReconciliationDashboard();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Payment reconciliation</h1>
      <p className="text-muted-foreground">
        Match Stripe payments, Xero invoices and MapAble records. Unmatched items
        require review.
      </p>

      {metrics && (
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Matched</p>
            <p className="text-2xl font-semibold">{metrics.matched ?? 0}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Unmatched</p>
            <p className="text-2xl font-semibold">{metrics.unmatched ?? 0}</p>
          </div>
          <div
            className={`rounded-lg border p-4 ${metrics.killCriteriaBreached ? "border-destructive" : ""}`}
          >
            <p className="text-sm text-muted-foreground">Unpaid error rate</p>
            <p className="text-2xl font-semibold">
              {(metrics.unpaidPercent ?? 0).toFixed(1)}%
            </p>
            {metrics.killCriteriaBreached && (
              <p className="mt-1 text-sm text-destructive">Exceeds 2% threshold</p>
            )}
          </div>
        </section>
      )}

      {batches.map((b) => (
        <section key={b.id} className="rounded-lg border p-4">
          <h2 className="font-medium">
            Batch {b.createdAt.toLocaleDateString("en-AU")} — {b.status}
          </h2>
          <ul className="mt-2 text-sm">
            {b.exceptions.map((e) => (
              <li key={e.id} className="py-1">
                {e.matchStatus}
                {e.reasonCode ? ` (${e.reasonCode})` : ""} — workflow:{" "}
                {e.workflowState} — invoice {e.invoiceId?.slice(0, 8) ?? "n/a"}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
