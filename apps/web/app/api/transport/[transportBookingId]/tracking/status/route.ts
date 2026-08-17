import type { TripTrackingStatus } from "@prisma/client";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { updateTripStatus } from "@/lib/tracking/trip-tracking-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { transportBookingId } = await params;
  const { status, message } = await req.json();
  if (!status) return jsonError("status required", 400);
  const result = await updateTripStatus(
    transportBookingId,
    status as TripTrackingStatus,
    user.id,
    message
  );
  return jsonOk(result);
}
