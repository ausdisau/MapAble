import { requireApiPermission } from "@/lib/api/auth-handler";
import {
  OrganisationAccessError,
  assertOrganisationAccess,
} from "@/lib/api/organisation-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { listPendingOrganisationInvites } from "@/lib/workers/worker-invite-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiPermission("worker:manage:org");
  if (user instanceof Response) return user;

  const { id: organisationId } = await params;
  try {
    await assertOrganisationAccess(user, organisationId);
    const invites = await listPendingOrganisationInvites(organisationId);
    return jsonOk({ invites });
  } catch (e) {
    if (e instanceof OrganisationAccessError)
      return jsonError("Forbidden", 403);
    throw e;
  }
}
