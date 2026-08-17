import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getLiveTrafficHazards } from "@/lib/tfnsw/live-traffic-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { trafficHazardsQuerySchema } from "@/lib/validation/tfnsw-schemas";

export async function GET(req: Request) {
  const user = await requireApiPermission("transport:read:org");
  if (user instanceof Response) return user;
  try {
    const url = new URL(req.url);
    const query = trafficHazardsQuerySchema.parse({
      category: url.searchParams.get("category") ?? undefined,
      state: url.searchParams.get("state") ?? undefined,
    });
    const hazards = await getLiveTrafficHazards(query);
    return jsonOk({ hazards, category: query.category, state: query.state });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
