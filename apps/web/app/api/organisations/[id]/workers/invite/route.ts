import { requireApiPermission } from "@/lib/api/auth-handler";
import { OrganisationAccessError } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { inviteWorkerToOrganisation } from "@/lib/workers/worker-invite-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiPermission("worker:manage:org");
  if (user instanceof Response) return user;

  const { id: organisationId } = await params;
  const body = (await req.json()) as { email?: string; displayName?: string };

  if (!body.email?.trim()) {
    return jsonError("email is required", 400);
  }

  try {
    const result = await inviteWorkerToOrganisation({
      organisationId,
      email: body.email,
      displayName: body.displayName,
      invitedBy: user,
    });
    return jsonOk(
      {
        invite: {
          id: result.invite.id,
          email: result.invite.email,
          displayName: result.invite.displayName,
          status: result.invite.status,
          expiresAt: result.invite.expiresAt,
          inviteUrl: result.inviteUrl,
        },
      },
      201,
    );
  } catch (e) {
    if (e instanceof OrganisationAccessError) {
      return jsonError("Forbidden", 403);
    }
    const message = e instanceof Error ? e.message : "Invite failed";
    if (message === "INVALID_EMAIL") return jsonError("Invalid email", 400);
    if (message === "WORKER_ALREADY_ASSOCIATED") {
      return jsonError(
        "Worker is already associated with this organisation",
        409,
      );
    }
    if (message === "INVITE_ALREADY_PENDING") {
      return jsonError("A pending invite already exists for this email", 409);
    }
    throw e;
  }
}
