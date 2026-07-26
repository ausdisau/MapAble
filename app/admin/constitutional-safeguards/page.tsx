import { requireAdmin } from "@/lib/auth/guards";
import { listActiveSafeguards } from "@/lib/governance/constitutional-safeguards/safeguards-service";

export default async function ConstitutionalSafeguardsAdminPage() {
  await requireAdmin();
  const articles = await listActiveSafeguards();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Constitutional safeguards</h1>
      <p className="text-sm text-muted-foreground">
        Operational principles only — not legal constitutional documents. Use Institutional
        Permanence admin to upsert articles.
      </p>
      <ul className="space-y-2">
        {articles.map((a) => (
          <li key={a.id} className="rounded border p-3 text-sm">
            {a.articleKey} — {a.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
