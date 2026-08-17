import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { runTransportVehicleMatch } from "@/lib/matching/matching-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> }
) {
  const user = await requireApiPermission("matching:run");
  if (user instanceof Response) return user;
  const { transportBookingId } = await params;
  const result = await runTransportVehicleMatch(transportBookingId, user.id);
  return jsonOk(result, 201);
}
