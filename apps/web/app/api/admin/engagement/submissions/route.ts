import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import {
  acknowledgeSubmission,
  listAdminEngagementQueue,
  updateSubmissionStatus,
} from "@/lib/engagement/engagement-submission-service";

export async function GET(req: Request) {
  if (!isEngagementPlatformEnabled()) {
    return jsonError("Engagement platform is not enabled", 404);
  }

  const user = await requireApiPermission("engagement:manage:any");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const type = url.searchParams.get("type") ?? undefined;

  const submissions = await listAdminEngagementQueue({
    status: status as never,
    type: type as never,
  });
  return jsonOk({ submissions });
}

export async function PATCH(req: Request) {
  if (!isEngagementPlatformEnabled()) {
    return jsonError("Engagement platform is not enabled", 404);
  }

  const user = await requireApiPermission("engagement:manage:any");
  if (user instanceof Response) return user;

  const body = await req.json();
  if (!body.submissionId) return jsonError("submissionId is required", 400);

  if (body.action === "acknowledge") {
    const submission = await acknowledgeSubmission(body.submissionId, user.id);
    return jsonOk({ submission });
  }

  if (body.status) {
    const submission = await updateSubmissionStatus(
      body.submissionId,
      body.status,
      user.id,
      body.note
    );
    return jsonOk({ submission });
  }

  return jsonError("Unknown action", 400);
}
