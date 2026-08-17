import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { startTripTracking } from "@/lib/tracking/trip-tracking-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { transportBookingId } = await params;
  const session = await startTripTracking(transportBookingId, user.id);
  return jsonOk({ session });
}
