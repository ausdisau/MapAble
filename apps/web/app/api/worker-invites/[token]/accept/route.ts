import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { acceptWorkerInvite } from "@/lib/workers/worker-invite-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { token } = await params;

  try {
    const result = await acceptWorkerInvite({
      token,
      userId: user.id,
      userEmail: user.email,
    });
    return jsonOk({
      profile: {
        id: result.profile?.id,
        displayName: result.profile?.displayName,
        organisationId: result.profile?.organisationId,
      },
      organisation: result.organisation,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Accept failed";
    if (message === "INVITE_NOT_FOUND") return jsonError("Invite not found", 404);
    if (message === "INVITE_NOT_AVAILABLE") {
      return jsonError("Invite is no longer available", 410);
    }
    if (message === "EMAIL_MISMATCH") {
      return jsonError(
        "Sign in with the email address that received this invite",
        403
      );
    }
    if (message === "WORKER_ALREADY_ASSOCIATED") {
      return jsonError("You are already a worker for this organisation", 409);
    }
    throw e;
  }
}
