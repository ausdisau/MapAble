import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getDriverTrip } from "@/lib/transport/transport-assignment-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiPermission("driver:trips");
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    return jsonOk(await getDriverTrip(user, tripId));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
