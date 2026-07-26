import { requireApiPermission } from "@/lib/api/auth-handler";
import { OrganisationAccessError } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { revokeWorkerInvite } from "@/lib/workers/worker-invite-service";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
  const user = await requireApiPermission("worker:manage:org");
  if (user instanceof Response) return user;

  const { id: organisationId, inviteId } = await params;

  try {
    await revokeWorkerInvite({ organisationId, inviteId, actor: user });
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof OrganisationAccessError) {
      return jsonError(
        e.message === "NOT_FOUND" ? "Not found" : "Forbidden",
        403,
      );
    }
    if (e instanceof Error && e.message === "INVITE_NOT_FOUND") {
      return jsonError("Invite not found", 404);
    }
    throw e;
  }
}
