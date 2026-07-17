import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { getRoutingAdapter } from "@/lib/transport-routing/routing-provider-registry";
import { routeMatrixSchema } from "@/lib/validation/transport-routing-schemas";

export async function POST(req: Request) {
  const user = await requireApiPermission("transport:read:org");
  if (user instanceof Response) return user;
  try {
    const body = routeMatrixSchema.parse(await req.json());
    const adapter = getRoutingAdapter();
    const matrix = await adapter.routeMatrix(body);
    return jsonOk({ matrix, provider: adapter.provider });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
