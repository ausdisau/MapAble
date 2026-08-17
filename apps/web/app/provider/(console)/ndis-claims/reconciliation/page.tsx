import { NdisDirectClaimingClient } from "@/components/provider/ndis-claiming/NdisDirectClaimingClient";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { requirePermission } from "@/lib/auth/guards";

export const metadata = { title: "Reconciliation | NDIS claiming | MapAble" };

export default async function ReconciliationPage() {
  const user = await requirePermission("provider:ndis:claim");
  const orgIds = await getUserOrganisationIds(user.id);
  return (
    <NdisDirectClaimingClient
      organisationId={orgIds[0]!}
      initialView="reconciliation"
    />
  );
}
