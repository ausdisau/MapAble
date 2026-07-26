import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { TransportApiError } from "@/lib/transport/transport-api-error";

export async function requireProviderOrgId(
  user: CurrentUser,
  organisationId?: string | null
) {
  const orgIds = await getUserOrganisationIds(user.id);
  const orgId = organisationId ?? orgIds[0];
  if (!orgId || !orgIds.includes(orgId)) {
    throw new TransportApiError("TRANSPORT_ACCESS_DENIED");
  }
  return orgId;
}
