import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { refreshRouteCache } from "@/lib/transport/routing/route-cache-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { routeCacheRefreshSchema } from "@/lib/validation/transport-routing-schemas";

export async function POST(req: Request) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  try {
    const body = routeCacheRefreshSchema.parse(await req.json().catch(() => ({})));
    return jsonOk(await refreshRouteCache(body));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
