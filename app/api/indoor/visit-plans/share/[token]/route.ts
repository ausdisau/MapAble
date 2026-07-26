import { featureDisabledResponse, indoorApiError } from "@/lib/access/indoor/api-errors";
import { isIndoorFeatureEnabled } from "@/lib/access/indoor/feature-flags";
import { resolveVisitPlanShare } from "@/lib/access/indoor/sharing/visit-plan-service";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  if (!isIndoorFeatureEnabled("sharedVisitPlans")) {
    return featureDisabledResponse("sharedVisitPlans");
  }

  const { token } = await params;
  const result = await resolveVisitPlanShare(token);
  if (!result) return indoorApiError("SHARE_LINK_INVALID", "Share link not found.", 404);
  if ("error" in result) {
    return indoorApiError(
      result.error === "revoked" ? "SHARE_LINK_REVOKED" : "SHARE_LINK_EXPIRED",
      result.error === "revoked" ? "This share link has been revoked." : "This share link has expired.",
      410,
    );
  }

  return Response.json({ plan: result.plan, scopes: result.scopes });
}
