import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { recordDriverLocation } from "@/lib/transport/transport-assignment-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { driverLocationSchema } from "@/lib/validation/transport-trip-schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiPermission("transport:drive");
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const { lat, lng } = driverLocationSchema.parse(await req.json());
    return jsonOk(await recordDriverLocation(user, tripId, lat, lng));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
