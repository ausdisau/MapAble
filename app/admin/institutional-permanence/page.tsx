import { PermanenceAdminForms } from "@/app/admin/institutional-permanence/PermanenceAdminForms";
import { requireAdmin } from "@/lib/auth/guards";
import { isInstitutionalPermanenceV2Enabled } from "@/lib/config/y5-rights-infrastructure";
import { getContinuityDashboard } from "@/lib/institutional-continuity/continuity-service";
import { listPublishedCivicAudits } from "@/lib/institutional-permanence/permanence-service";

export default async function InstitutionalPermanenceAdminPage() {
  await requireAdmin();
  const [{ plans }, audits] = await Promise.all([
    getContinuityDashboard(),
    listPublishedCivicAudits(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Institutional permanence</h1>
      {!isInstitutionalPermanenceV2Enabled() ? (
        <p className="text-amber-800">INSTITUTIONAL_PERMANENCE_V2_ENABLED is false.</p>
      ) : null}
      <PermanenceAdminForms />
      <section>
        <h2 className="font-medium">Continuity plans</h2>
        <ul className="mt-2 space-y-2">
          {plans.map((p) => (
            <li key={p.id} className="rounded border p-3 text-sm">
              {p.title} — {p.checkpoints.length} checkpoints
              <ul className="mt-1 space-y-1 pl-4">
                {p.checkpoints.map((c) => (
                  <li key={c.id} className="text-xs text-muted-foreground">
                    {c.title} ({c.completed ? "done" : "pending"}) — ID: {c.id}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-medium">Published audits</h2>
        <ul className="mt-2 space-y-2">
          {audits.map((a) => (
            <li key={a.id} className="rounded border p-3 text-sm">
              {a.auditYear} — {a.title}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
