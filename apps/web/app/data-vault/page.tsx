import Link from "next/link";

import { DataVaultRequestForm } from "@/app/data-vault/DataVaultRequestForm";
import { requirePermission } from "@/lib/auth/guards";
import { HUMAN_REVIEW_DISCLAIMER, isDataVaultV2Enabled } from "@/lib/config/y4-civic-platform";
import { listVaultRequestsForUser } from "@/lib/personal-data-vault/vault-service";

export default async function DataVaultPage() {
  const user = await requirePermission("data_vault:self");
  const requests = await listVaultRequestsForUser(user.id).catch(() => []);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="font-heading text-2xl font-bold">Personal data vault</h1>
      {!isDataVaultV2Enabled() ? (
        <p>Data vault is disabled in this environment.</p>
      ) : (
        <>
          <p className="text-muted-foreground">{HUMAN_REVIEW_DISCLAIMER}</p>
          <DataVaultRequestForm />
        </>
      )}
      <Link href="/dashboard" className="text-sm text-primary underline">
        Back to dashboard
      </Link>
      <ul className="space-y-2">
        {requests.map((r) => (
          <li key={r.id} className="rounded border p-3 text-sm">
            {r.requestType} — {r.status}
            {r.rejectionReason ? ` — ${r.rejectionReason}` : ""}
            <span className="ml-2 text-xs text-muted-foreground">
              {r.createdAt.toLocaleDateString("en-AU")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
