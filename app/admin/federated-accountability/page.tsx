import { FederatedAccountabilityForm } from "@/app/admin/federated-accountability/FederatedAccountabilityForm";
import { requireAdmin } from "@/lib/auth/guards";
import { isFederatedAccountabilityV2Enabled } from "@/lib/config/y5-rights-infrastructure";
import { listAccountabilityPartners } from "@/lib/federated-accountability/federation-partner-service";

export default async function FederatedAccountabilityPage() {
  await requireAdmin();
  const partners = await listAccountabilityPartners();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Federated accountability</h1>
      {!isFederatedAccountabilityV2Enabled() ? (
        <p className="text-amber-800">FEDERATED_ACCOUNTABILITY_V2_ENABLED is false.</p>
      ) : null}
      <FederatedAccountabilityForm />
      <ul className="space-y-2">
        {partners.map((p) => (
          <li key={p.id} className="rounded border p-3 text-sm">
            {p.partnerName} — {p.jurisdictionLabel ?? p.jurisdiction ?? "n/a"} — {p.scope}
            {p.linkedPublicationId ? (
              <p className="text-xs text-muted-foreground">Linked: {p.linkedPublicationId}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
