import { requireAdmin } from "@/lib/auth/guards";
import { listPublishedCivicAudits } from "@/lib/platform/institutional-permanence/permanence-service";

export default async function CivicAuditIndexPage() {
  await requireAdmin();
  const audits = await listPublishedCivicAudits();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Civic audit index</h1>
      <p className="text-sm text-muted-foreground">
        Use Institutional Permanence admin for publish workflow.
      </p>
      <ul className="space-y-2">
        {audits.map((a) => (
          <li key={a.id} className="rounded border p-3">
            {a.auditYear} — {a.title} (score: {a.overallScore ?? "n/a"})
          </li>
        ))}
      </ul>
    </div>
  );
}
