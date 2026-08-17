import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { recordNpsResponse } from "@/lib/engagement/nps-service";

export async function POST(req: Request) {
  if (!isEngagementPlatformEnabled()) {
    return jsonError("Engagement platform is not enabled", 404);
  }

  const user = await requireApiPermission("engagement:submit:self");
  if (user instanceof Response) return user;

  const body = await req.json();
  if (typeof body.score !== "number") {
    return jsonError("score is required (0–10)", 400);
  }

  try {
    const response = await recordNpsResponse({
      participantId: body.participantId ?? user.id,
      score: body.score,
      comment: body.comment,
      contextType: body.contextType,
      contextId: body.contextId,
      organisationId: body.organisationId,
      submissionId: body.submissionId,
    });
    return jsonOk({ response }, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Could not record NPS", 400);
  }
}
