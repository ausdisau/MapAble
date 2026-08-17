import { requireAdmin } from "@/lib/auth/guards";
import { listCouncilRecords } from "@/lib/governance/data-trust-council/council-service";

export default async function DataTrustCouncilPage() {
  await requireAdmin();
  const records = await listCouncilRecords();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Data trust council</h1>
      <ul className="space-y-2">
        {records.map((r) => (
          <li key={r.id} className="rounded border p-3">
            {r.title} — {r.status}
            <p className="text-sm text-muted-foreground">{r.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
