import { requireAdmin } from "@/lib/auth/guards";
import { getSettlementBatchesDashboard } from "@/lib/billing/settlement-batches/settlement-service";

export default async function SettlementBatchesPage() {
  await requireAdmin();
  const { batches } = await getSettlementBatchesDashboard();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Settlement batches</h1>
      <ul className="space-y-2">
        {batches.map((b) => (
          <li key={b.id} className="rounded border p-3">
            {b.periodStart.toLocaleDateString("en-AU")} –{" "}
            {b.periodEnd.toLocaleDateString("en-AU")} — {b.status} — $
            {(b.totalCents / 100).toFixed(2)} ({b.itemCount} lines)
          </li>
        ))}
      </ul>
    </div>
  );
}
