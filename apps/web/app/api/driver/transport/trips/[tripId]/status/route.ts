import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { driverUpdateTripStatus } from "@/lib/transport/transport-assignment-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { driverStatusUpdateSchema } from "@/lib/validation/transport-trip-schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiPermission("transport:drive");
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const { status, message } = driverStatusUpdateSchema.parse(await req.json());
    return jsonOk(await driverUpdateTripStatus(user, tripId, status, message));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
