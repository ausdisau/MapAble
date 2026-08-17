import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { lockRideRun } from "@/lib/transport/ride-run-service";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  const { runId } = await params;
  try {
    await requireProviderOrgId(user, orgId);
    const run = await lockRideRun(user, orgId, runId);
    return jsonOk({ run });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
