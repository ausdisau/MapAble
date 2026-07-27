import { requireApiPermission } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk } from "@/lib/api/response";
import { qualityAccreditationConfig } from "@/lib/config/quality-accreditation";
import { canProviderAccessOrg } from "@/lib/engagement/engagement-access";
import { getProviderQualityDashboard } from "@/lib/quality/dashboard-service";

export async function GET(req: Request) {
  if (!qualityAccreditationConfig.qmsEnabled) {
    return jsonError("Quality QMS is not enabled", 503);
  }

  const user = await requireApiPermission("engagement:provider:read");
  if (isResponse(user)) return user;

  const organisationId = new URL(req.url).searchParams.get("organisationId");
  if (!organisationId) {
    return jsonError("organisationId is required", 400);
  }

  const allowed = await canProviderAccessOrg(user.id, organisationId);
  if (!allowed) return jsonError("Not authorised", 403);

  try {
    return jsonOk({ dashboard: await getProviderQualityDashboard(organisationId) });
  } catch (e) {
    if (e instanceof Error && e.message === "QUALITY_QMS_DISABLED") {
      return jsonError("Quality QMS is not enabled", 503);
    }
    return jsonError("Failed to load dashboard", 500);
  }
}
