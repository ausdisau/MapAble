import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { resolveEngagementParticipantId } from "@/lib/engagement/engagement-access";
import { listImprovementsForParticipant } from "@/lib/engagement/engagement-improvement-service";

export async function GET(req: Request) {
  if (!isEngagementPlatformEnabled()) {
    return jsonError("Engagement platform is not enabled", 404);
  }

  const user = await requireApiPermission("engagement:read:self");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const participantIdParam = url.searchParams.get("participantId") ?? undefined;

  const resolved = await resolveEngagementParticipantId({
    userId: user.id,
    role: user.primaryRole,
    requestedParticipantId:
      participantIdParam ?? (user.primaryRole === "participant" ? user.id : undefined),
  });

  if (!resolved) return jsonError("Not authorised", 403);

  const improvements = await listImprovementsForParticipant(resolved.participantId);
  return jsonOk({ improvements });
}
