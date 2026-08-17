import { requireAdmin } from "@/lib/auth/guards";
import { getReportingSummary } from "@/lib/reporting/snapshot-service";

export default async function AdminReportingPage() {
  await requireAdmin();
  const data = await getReportingSummary();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Reporting</h1>
      <p className="text-muted-foreground">
        Aggregate metrics with small-cell suppression. No private notes in exports.
      </p>
      <ul>
        {data.snapshots.map((s) => (
          <li key={s.id} className="border-b py-2 text-sm">
            {s.category ?? "mixed"} — {s.snapshotDate.toLocaleDateString("en-AU")}
          </li>
        ))}
      </ul>
    </div>
  );
}
