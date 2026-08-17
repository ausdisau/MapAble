import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { suggestMatchesForTrip } from "@/lib/transport/match-suggestion-service";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiPermission("transport:read:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  const { tripId } = await params;
  try {
    await requireProviderOrgId(user, orgId);
    const suggestions = await suggestMatchesForTrip({
      organisationId: orgId,
      tripId,
    });
    return jsonOk({ suggestions, requiresHumanReview: true });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
