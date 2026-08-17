import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { providerAcceptCareBooking } from "@/lib/care/care-booking-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const booking = await providerAcceptCareBooking(id, user);
    return jsonOk({ booking });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    return jsonError("Forbidden", 403);
  }
}
