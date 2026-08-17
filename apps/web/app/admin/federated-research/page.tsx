import { FederatedResearchAdminForm } from "@/app/admin/federated-research/FederatedResearchAdminForm";
import { requireAdmin } from "@/lib/auth/guards";
import {
  FEDERATED_RESEARCH_DISCLAIMER,
  isFederatedResearchV2Enabled,
} from "@/lib/config/y5-rights-infrastructure";
import { listFederatedAgreements } from "@/lib/research/federated/federation-service";

export default async function FederatedResearchPage() {
  await requireAdmin();
  const data = await listFederatedAgreements();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Federated research</h1>
      <p className="text-sm text-muted-foreground">{FEDERATED_RESEARCH_DISCLAIMER}</p>
      {!isFederatedResearchV2Enabled() ? (
        <p className="text-amber-800">FEDERATED_RESEARCH_V2_ENABLED is false.</p>
      ) : null}
      <FederatedResearchAdminForm />
      {data.disabled ? (
        <p>Disabled.</p>
      ) : (
        <ul className="space-y-2">
          {data.agreements.map((a) => (
            <li key={a.id} className="rounded border p-3 text-sm">
              {a.partnerName} — {a.status}
              <p className="text-xs text-muted-foreground">ID: {a.id}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
