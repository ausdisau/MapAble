import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { declineTransportBooking } from "@/lib/transport/driver-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> }
) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  const { transportBookingId } = await params;
  const booking = await declineTransportBooking(transportBookingId, user.id);
  return jsonOk({ booking });
}
