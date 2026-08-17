import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import {
  createImprovementAction,
  listAdminImprovementActions,
  updateImprovementAction,
} from "@/lib/engagement/engagement-improvement-service";

export async function GET() {
  if (!isEngagementPlatformEnabled()) {
    return jsonError("Engagement platform is not enabled", 404);
  }

  const user = await requireApiPermission("engagement:manage:any");
  if (user instanceof Response) return user;

  const actions = await listAdminImprovementActions();
  return jsonOk({ actions });
}

export async function POST(req: Request) {
  if (!isEngagementPlatformEnabled()) {
    return jsonError("Engagement platform is not enabled", 404);
  }

  const user = await requireApiPermission("engagement:manage:any");
  if (user instanceof Response) return user;

  const body = await req.json();
  if (!body.title || !body.summary) {
    return jsonError("title and summary are required", 400);
  }

  const action = await createImprovementAction({
    submissionId: body.submissionId,
    participantId: body.participantId,
    organisationId: body.organisationId,
    title: body.title,
    summary: body.summary,
    sourceComplaintId: body.sourceComplaintId,
    responsibleUserId: body.responsibleUserId ?? user.id,
    targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
    visibleToParticipant: body.visibleToParticipant,
  });

  return jsonOk({ action }, 201);
}

export async function PATCH(req: Request) {
  if (!isEngagementPlatformEnabled()) {
    return jsonError("Engagement platform is not enabled", 404);
  }

  const user = await requireApiPermission("engagement:manage:any");
  if (user instanceof Response) return user;

  const body = await req.json();
  if (!body.actionId) return jsonError("actionId is required", 400);

  const action = await updateImprovementAction(body.actionId, {
    status: body.status,
    summary: body.summary,
    effectivenessReview: body.effectivenessReview,
  });

  return jsonOk({ action });
}
