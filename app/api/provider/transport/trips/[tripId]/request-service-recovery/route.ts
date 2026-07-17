import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { requestServiceRecovery } from "@/lib/transport/transport-trip-service";
import { serviceRecoverySchema } from "@/lib/validation/transport-assignment-schemas";

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
    const { reason } = serviceRecoverySchema.parse(await req.json());
    return jsonOk(await requestServiceRecovery(user, tripId, orgId, reason));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
