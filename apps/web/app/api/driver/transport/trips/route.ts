import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getDriverTrips } from "@/lib/transport/transport-assignment-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

export async function GET() {
  const user = await requireApiPermission("driver:trips");
  if (user instanceof Response) return user;
  try {
    return jsonOk({ trips: await getDriverTrips(user) });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
