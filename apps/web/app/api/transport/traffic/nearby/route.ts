import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { isTfnswLiveTrafficAvailable } from "@/lib/config/tfnsw";
import { tfnswNotConfiguredError } from "@/lib/tfnsw/tfnsw-api-error";
import { buildTrafficAdvisoryForRoute } from "@/lib/tfnsw/traffic-advisory-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { trafficNearbySchema } from "@/lib/validation/tfnsw-schemas";

export async function POST(req: Request) {
  const user = await requireApiPermission("transport:read:org");
  if (user instanceof Response) return user;
  try {
    const body = trafficNearbySchema.parse(await req.json());
    if (!isTfnswLiveTrafficAvailable()) {
      throw tfnswNotConfiguredError();
    }
    const advisory = await buildTrafficAdvisoryForRoute({
      origin: body.origin,
      destination: body.destination,
      waypoints: body.waypoints,
      maxHazards: body.maxHazards,
      radiusMetres: body.radiusMetres,
      force: true,
    });
    return jsonOk({
      advisory,
      enabled: advisory !== null,
    });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
