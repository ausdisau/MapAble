import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { createRouteEstimate } from "@/lib/transport-routing/route-estimate-service";
import { routeEstimateSchema } from "@/lib/validation/transport-routing-schemas";

export async function POST(req: Request) {
  const user = await requireApiPermission("transport:read:org");
  if (user instanceof Response) return user;
  try {
    const body = routeEstimateSchema.parse(await req.json());
    const result = await createRouteEstimate({
      input: {
        origin: body.origin,
        destination: body.destination,
        waypoints: body.waypoints,
      },
      tripId: body.tripId,
    });
    return jsonOk(result);
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
