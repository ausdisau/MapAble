import { requireAdmin } from "@/lib/auth/guards";
import { getPartnerBillingDashboard } from "@/lib/billing/partner/billing-service";

export default async function PartnerBillingPage() {
  await requireAdmin();
  const { accounts } = await getPartnerBillingDashboard();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Partner billing</h1>
      <ul className="space-y-2">
        {accounts.map((a) => (
          <li key={a.id} className="rounded border p-3 text-sm">
            Org {a.organisationId.slice(0, 8)} — {a.planCode} ({a.status}) —{" "}
            {a.invoices.length} invoices
          </li>
        ))}
      </ul>
    </div>
  );
}
