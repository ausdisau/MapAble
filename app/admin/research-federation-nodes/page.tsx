import { FederationNodesAdminForm } from "@/app/admin/research-federation-nodes/FederationNodesAdminForm";
import { requireAdmin } from "@/lib/auth/guards";
import { isResearchFederationAtScaleV2Enabled } from "@/lib/config/y5-rights-infrastructure";
import { listFederationNodes } from "@/lib/research/federation-at-scale/federation-node-service";

export default async function ResearchFederationNodesPage() {
  await requireAdmin();
  const data = await listFederationNodes();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Research federation nodes</h1>
      {!isResearchFederationAtScaleV2Enabled() ? (
        <p className="text-amber-800">RESEARCH_FEDERATION_AT_SCALE_V2_ENABLED is false.</p>
      ) : null}
      <FederationNodesAdminForm />
      {data.disabled ? (
        <p>Disabled.</p>
      ) : (
        <ul className="space-y-2">
          {data.nodes.map((n) => (
            <li key={n.id} className="rounded border p-3 text-sm">
              {n.nodeName} — {n.status}
              <p className="text-xs text-muted-foreground">ID: {n.id}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
