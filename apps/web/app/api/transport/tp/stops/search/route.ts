import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { findStops } from "@/lib/tfnsw/trip-planner-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { tpStopFinderSchema } from "@/lib/validation/tfnsw-schemas";

export async function GET(req: Request) {
  const user = await requireApiPermission("transport:read:org");
  if (user instanceof Response) return user;
  try {
    const url = new URL(req.url);
    const params = tpStopFinderSchema.parse({
      query: url.searchParams.get("query"),
      maxResults: url.searchParams.get("maxResults")
        ? Number(url.searchParams.get("maxResults"))
        : undefined,
    });
    const results = await findStops(params);
    return jsonOk({ results, query: params.query });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
