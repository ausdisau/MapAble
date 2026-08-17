import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { driverRejectTrip } from "@/lib/transport/transport-assignment-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { declineTripSchema } from "@/lib/validation/transport-assignment-schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiPermission("transport:drive");
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const body = declineTripSchema.safeParse(await req.json().catch(() => ({})));
    return jsonOk(
      await driverRejectTrip(user, tripId, body.success ? body.data.reason : undefined)
    );
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
