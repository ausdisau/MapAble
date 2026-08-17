import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getStopsNearCoordinate } from "@/lib/tfnsw/trip-planner-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { tpCoordSchema } from "@/lib/validation/tfnsw-schemas";

export async function GET(req: Request) {
  const user = await requireApiPermission("transport:read:org");
  if (user instanceof Response) return user;
  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const params = tpCoordSchema.parse({
      lat: lat != null ? Number(lat) : undefined,
      lng: lng != null ? Number(lng) : undefined,
      radiusMetres: url.searchParams.get("radiusMetres")
        ? Number(url.searchParams.get("radiusMetres"))
        : undefined,
    });
    const stops = await getStopsNearCoordinate(params);
    return jsonOk({ stops, ...params });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
