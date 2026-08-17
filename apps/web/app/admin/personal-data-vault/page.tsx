import { VaultRequestActions } from "@/app/admin/personal-data-vault/VaultRequestActions";
import { requireAdmin } from "@/lib/auth/guards";
import { HUMAN_REVIEW_DISCLAIMER } from "@/lib/config/y4-civic-platform";
import { listAllVaultRequests } from "@/lib/personal-data-vault/vault-service";

export default async function PersonalDataVaultAdminPage() {
  await requireAdmin();
  const requests = await listAllVaultRequests();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Personal data vault</h1>
      <p className="text-muted-foreground">{HUMAN_REVIEW_DISCLAIMER}</p>
      <ul className="space-y-2">
        {requests.map((r) => (
          <li key={r.id} className="rounded border p-3 text-sm">
            {r.requestType} — user {r.userId.slice(0, 8)} — {r.status}
            <VaultRequestActions requestId={r.id} status={r.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
