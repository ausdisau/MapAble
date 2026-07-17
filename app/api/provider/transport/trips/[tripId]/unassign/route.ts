import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { unassignTrip } from "@/lib/transport/transport-assignment-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  const { tripId } = await params;
  try {
    await requireProviderOrgId(user, orgId);
    return jsonOk(await unassignTrip(user, tripId, orgId));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
