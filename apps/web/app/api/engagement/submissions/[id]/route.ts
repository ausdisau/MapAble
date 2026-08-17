import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { resolveEngagementContext } from "@/lib/engagement/engagement-context-resolver";
import { getEngagementSubmissionForUser } from "@/lib/engagement/engagement-submission-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isEngagementPlatformEnabled()) {
    return jsonError("Engagement platform is not enabled", 404);
  }

  const user = await requireApiPermission("engagement:read:self");
  if (user instanceof Response) return user;

  const { id } = await params;
  const submission = await getEngagementSubmissionForUser(
    id,
    user.id,
    user.primaryRole
  );

  if (!submission) return jsonError("Not found", 404);

  const context = await resolveEngagementContext(
    submission.contextType,
    submission.contextId
  );

  return jsonOk({ submission, context });
}
