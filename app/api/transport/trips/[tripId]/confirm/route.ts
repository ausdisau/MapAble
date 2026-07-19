import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { confirmTransportTrip } from "@/lib/transport/transport-trip-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiPermission("transport:manage:self");
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    return jsonOk(await confirmTransportTrip(user, tripId));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
