import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { cancelTransportTrip } from "@/lib/transport/transport-trip-service";
import { cancelTransportTripSchema } from "@/lib/validation/transport-trip-schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const body = cancelTransportTripSchema.safeParse(await req.json().catch(() => ({})));
    return jsonOk(
      await cancelTransportTrip(user, tripId, body.success ? body.data.reason : undefined)
    );
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
