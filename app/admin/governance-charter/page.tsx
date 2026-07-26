import { GovernanceCharterActions } from "@/app/admin/governance-charter/GovernanceCharterActions";
import { requireAdmin } from "@/lib/auth/guards";
import { listCharters } from "@/lib/governance/charter/charter-service";

export default async function GovernanceCharterAdminPage() {
  await requireAdmin();
  const charters = await listCharters();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Governance charter</h1>
      <ul className="space-y-2">
        {charters.map((c) => (
          <li key={c.id} className="rounded border p-3">
            {c.title} v{c.version} — {c.status}
            {c.status === "draft" ? (
              <GovernanceCharterActions version={c.version} />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
