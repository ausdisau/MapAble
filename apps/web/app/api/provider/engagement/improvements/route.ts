import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { canProviderAccessOrg } from "@/lib/engagement/engagement-access";
import { listProviderImprovements } from "@/lib/engagement/engagement-improvement-service";

export async function GET(req: Request) {
  if (!isEngagementPlatformEnabled()) {
    return jsonError("Engagement platform is not enabled", 404);
  }

  const user = await requireApiPermission("engagement:provider:read");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const organisationId = url.searchParams.get("organisationId");
  if (!organisationId) return jsonError("organisationId is required", 400);

  const allowed = await canProviderAccessOrg(user.id, organisationId);
  if (!allowed) return jsonError("Not authorised for this organisation", 403);

  const improvements = await listProviderImprovements(organisationId);
  return jsonOk({ improvements });
}
