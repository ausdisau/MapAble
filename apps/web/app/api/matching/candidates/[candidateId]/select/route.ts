import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { platformPatternsConfig } from "@/lib/config/platform-patterns";
import {
  selectMatchCandidate,
} from "@/lib/matching/matching-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const user = await requireApiPermission("matching:select");
  if (user instanceof Response) return user;
  const { candidateId } = await params;
  const body = await req.json().catch(() => ({}));

  const participantConfirmed = body.participantConfirmed === true;
  const adminOverride =
    body.adminOverride === true && isAdminRole(user.primaryRole);

  if (
    platformPatternsConfig.matchParticipantConfirmRequired &&
    user.primaryRole === "participant" &&
    !participantConfirmed
  ) {
    return jsonError("Participant confirmation required", 400);
  }

  try {
    const candidate = await selectMatchCandidate(
      candidateId,
      user.id,
      body.notes,
      {
        participantConfirmed:
          participantConfirmed || user.primaryRole === "participant",
        adminOverride,
      }
    );
    return jsonOk({ candidate });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Select failed";
    if (message === "PARTICIPANT_CONFIRMATION_REQUIRED") {
      return jsonError("Participant confirmation required before assignment", 403);
    }
    throw e;
  }
}
