import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import {
  resolveEngagementParticipantId,
} from "@/lib/engagement/engagement-access";
import {
  createEngagementSubmission,
  listEngagementSubmissions,
} from "@/lib/engagement/engagement-submission-service";

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

  const submissions = await listEngagementSubmissions(resolved.participantId);
  return jsonOk({ submissions, mode: resolved.mode, participantId: resolved.participantId });
}

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

  if (!participantId) {
    return jsonError("participantId is required", 400);
  }

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
      type: body.type,
      title: body.title,
      body: body.body,
      rating: body.rating,
      contextType: body.contextType,
      contextId: body.contextId,
      organisationId: body.organisationId,
      involvesSafety: body.involvesSafety,
      advocateInvolved: body.advocateInvolved,
    });
    return jsonOk({ submission }, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Could not create submission", 400);
  }
}
