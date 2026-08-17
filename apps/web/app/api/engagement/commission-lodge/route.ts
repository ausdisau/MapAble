import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { getEngagementSubmissionForUser } from "@/lib/engagement/engagement-submission-service";
import { lodgeWithCommissionAssisted } from "@/lib/engagement/ndis-commission-client";

export async function POST(req: Request) {
  if (!isEngagementPlatformEnabled()) {
    return jsonError("Engagement platform is not enabled", 404);
  }

  const user = await requireApiPermission("engagement:submit:self");
  if (user instanceof Response) return user;

  const body = await req.json();
  if (!body.submissionId) return jsonError("submissionId is required", 400);
  if (!body.consentConfirmed) {
    return jsonError("Explicit consent is required for Commission escalation", 400);
  }

  const submission = await getEngagementSubmissionForUser(
    body.submissionId,
    user.id,
    user.primaryRole
  );
  if (!submission) return jsonError("Not found", 404);

  try {
    const result = await lodgeWithCommissionAssisted(
      body.submissionId,
      user.id,
      true
    );
    return jsonOk(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Could not lodge", 400);
  }
}
