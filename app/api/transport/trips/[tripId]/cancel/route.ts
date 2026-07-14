import { emitCareOSDomainEventBestEffort } from "@/intelligence/continuity/domain-event-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { cancelTransportTrip } from "@/lib/transport/transport-trip-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { cancelTransportTripSchema } from "@/lib/validation/transport-trip-schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const body = cancelTransportTripSchema.safeParse(
      await req.json().catch(() => ({})),
    );
    const result = await cancelTransportTrip(
      user,
      tripId,
      body.success ? body.data.reason : undefined,
    );
    void emitCareOSDomainEventBestEffort({
      participantId: result.trip.participantId,
      eventType: "transport_cancelled",
      sourceModule: "transport",
      sourceEntityId: result.trip.id,
      summary: "An accessible transport request linked to the participant was cancelled.",
      actorUserId: user.id,
      metadata: {
        reasonProvided: Boolean(body.success && body.data.reason),
      },
    });
    return jsonOk(result);
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
