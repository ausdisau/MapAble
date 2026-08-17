import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createRideRun, listRideRuns } from "@/lib/transport/ride-run-service";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

const createRunSchema = z.object({
  vehicleId: z.string().min(1),
  driverId: z.string().optional(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime().optional(),
  maxPassengers: z.number().int().min(2).max(8).optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET(req: Request) {
  const user = await requireApiPermission("transport:read:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  try {
    await requireProviderOrgId(user, orgId);
    const runs = await listRideRuns(user, orgId);
    return jsonOk({ runs });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}

export async function POST(req: Request) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  try {
    await requireProviderOrgId(user, orgId);
    const body = createRunSchema.parse(await req.json());
    const run = await createRideRun(user, orgId, body);
    return jsonOk({ run }, 201);
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
