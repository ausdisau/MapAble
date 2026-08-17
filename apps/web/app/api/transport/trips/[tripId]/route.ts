import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import {
  getTransportTripForUser,
  patchTransportTrip,
} from "@/lib/transport/transport-trip-service";
import { patchTransportTripSchema } from "@/lib/validation/transport-trip-schemas";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    return jsonOk(await getTransportTripForUser(user, tripId));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const body = patchTransportTripSchema.parse(await req.json());
    return jsonOk(await patchTransportTrip(user, tripId, body));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
