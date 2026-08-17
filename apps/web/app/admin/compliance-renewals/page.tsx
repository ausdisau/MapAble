import { requireAdmin } from "@/lib/auth/guards";
import { getComplianceRenewalsDashboard } from "@/lib/compliance/renewals/renewal-service";

export default async function ComplianceRenewalsPage() {
  await requireAdmin();
  const { renewals, overdueCount } = await getComplianceRenewalsDashboard();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Compliance renewals</h1>
      <p className="text-sm text-amber-800">{overdueCount} overdue</p>
      <ul className="space-y-2">
        {renewals.map((r) => (
          <li key={r.id} className="rounded border p-3">
            {r.title} — due {r.dueAt.toLocaleDateString("en-AU")} ({r.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
