import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { canProviderAccessOrg } from "@/lib/engagement/engagement-access";
import {
  getCsatAverage,
  getOrgBenchmarkComparison,
} from "@/lib/engagement/nps-service";

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

  const since = new Date();
  since.setMonth(since.getMonth() - 3);

  const [benchmark, csat] = await Promise.all([
    getOrgBenchmarkComparison(organisationId),
    getCsatAverage(organisationId, since),
  ]);

  return jsonOk({ benchmark, csat, since });
}
