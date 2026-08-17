import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { resolveEngagementParticipantId } from "@/lib/engagement/engagement-access";
import { createEngagementSubmission } from "@/lib/engagement/engagement-submission-service";

export async function POST(req: Request) {
  if (!isEngagementPlatformEnabled()) {
    return jsonError("Engagement platform is not enabled", 404);
  }

  const user = await requireApiPermission("engagement:submit:self");
  if (user instanceof Response) return user;

  const body = await req.json();
  const participantId =
    body.participantId ??
    (user.primaryRole === "participant" ? user.id : undefined);

  if (!participantId) return jsonError("participantId is required", 400);
  if (!body.body?.trim()) return jsonError("Description is required", 400);

  const resolved = await resolveEngagementParticipantId({
    userId: user.id,
    role: user.primaryRole,
    requestedParticipantId: participantId,
  });

  if (!resolved || resolved.mode === "delegate_read") {
    return jsonError("Not authorised to submit", 403);
  }

  try {
    const submission = await createEngagementSubmission({
      participantId: resolved.participantId,
      submittedById: user.id,
      delegateScope: resolved.delegateScope,
      type: "complaint",
      title: body.title ?? "Formal complaint",
      body: body.body,
      organisationId: body.organisationId,
      involvesSafety: body.involvesSafety,
      advocateInvolved: body.advocateInvolved,
    });
    return jsonOk({ submission }, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Could not file complaint", 400);
  }
}
