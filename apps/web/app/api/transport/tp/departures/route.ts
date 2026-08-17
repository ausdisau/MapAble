import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getDeparturesAtStop } from "@/lib/tfnsw/trip-planner-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { tpDeparturesSchema } from "@/lib/validation/tfnsw-schemas";

export async function GET(req: Request) {
  const user = await requireApiPermission("transport:read:org");
  if (user instanceof Response) return user;
  try {
    const url = new URL(req.url);
    const params = tpDeparturesSchema.parse({
      stopId: url.searchParams.get("stopId"),
      itdDate: url.searchParams.get("itdDate") ?? undefined,
      itdTime: url.searchParams.get("itdTime") ?? undefined,
      platformId: url.searchParams.get("platformId") ?? undefined,
    });
    const departures = await getDeparturesAtStop(params);
    return jsonOk({ departures, stopId: params.stopId });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
