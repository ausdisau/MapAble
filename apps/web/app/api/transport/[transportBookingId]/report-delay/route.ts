import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { reportTripDelay } from "@/lib/tracking/trip-tracking-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { transportBookingId } = await params;
  const { reason } = await req.json();
  if (!reason) return jsonError("reason required", 400);
  const result = await reportTripDelay(transportBookingId, user.id, reason);
  return jsonOk(result);
}
