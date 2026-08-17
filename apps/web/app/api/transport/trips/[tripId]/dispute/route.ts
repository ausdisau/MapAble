import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { disputeTransportTrip } from "@/lib/transport/transport-trip-service";
import { disputeTransportTripSchema } from "@/lib/validation/transport-trip-schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiPermission("transport:manage:self");
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const { reason } = disputeTransportTripSchema.parse(await req.json());
    return jsonOk(await disputeTransportTrip(user, tripId, reason));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
