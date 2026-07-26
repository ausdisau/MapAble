import { requireAdmin } from "@/lib/auth/guards";
import { listSecurityAuditPacks } from "@/lib/security/external-audit/audit-pack-service";

export default async function SecurityAuditPacksPage() {
  await requireAdmin();
  const packs = await listSecurityAuditPacks();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">External security audit packs</h1>
      <ul className="space-y-2">
        {packs.map((p) => (
          <li key={p.id} className="rounded border p-3">
            {p.title} — {p.framework} ({p.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
