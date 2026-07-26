import { NdisDirectClaimingClient } from "@/components/provider/ndis-claiming/NdisDirectClaimingClient";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { requirePermission } from "@/lib/auth/guards";

export const metadata = { title: "Rejected claims | NDIS claiming | MapAble" };

export default async function RejectedClaimsPage() {
  const user = await requirePermission("provider:ndis:claim");
  const orgIds = await getUserOrganisationIds(user.id);
  return (
    <NdisDirectClaimingClient organisationId={orgIds[0]!} initialView="rejected" />
  );
}
