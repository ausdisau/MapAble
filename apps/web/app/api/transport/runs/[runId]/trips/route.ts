import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { attachTripToRideRun } from "@/lib/transport/ride-run-service";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

const attachSchema = z.object({ tripId: z.string().min(1) });

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
    const { tripId } = attachSchema.parse(await req.json());
    const run = await attachTripToRideRun(user, orgId, runId, tripId);
    return jsonOk({ run });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
