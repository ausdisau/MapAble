import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getTripTracking } from "@/lib/tracking/trip-tracking-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { transportBookingId } = await params;
  const tracking = await getTripTracking(transportBookingId);
  if (!tracking) return jsonError("No tracking session", 404);
  return jsonOk(tracking);
}
