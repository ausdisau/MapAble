import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { listProviderTrips } from "@/lib/transport/transport-trip-service";

export async function GET(req: Request) {
  const user = await requireApiPermission("transport:read:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  try {
    await requireProviderOrgId(user, orgId);
    const trips = await listProviderTrips(user, orgId);
    return jsonOk({ trips });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
