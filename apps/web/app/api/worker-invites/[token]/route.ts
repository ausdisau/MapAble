import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getWorkerInviteByToken,
  maskEmail,
} from "@/lib/workers/worker-invite-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invite = await getWorkerInviteByToken(token);
  if (!invite) return jsonError("Invite not found", 404);

  return jsonOk({
    invite: {
      status: invite.status,
      organisationName: invite.organisation.name,
      emailMasked: maskEmail(invite.email),
      displayName: invite.displayName,
      expiresAt: invite.expiresAt,
      acceptedAt: invite.acceptedAt,
    },
  });
}
