import { requireApiPermission } from "@/lib/api/auth-handler";
import {
  isResponse,
  jsonError,
  jsonOk,
  zodErrorResponse,
} from "@/lib/api/response";
import {
  assertOrgAccess,
  createClaimLineFromBooking,
} from "@/lib/ndis/claiming/claim-service";
import { claimFromBookingSchema } from "@/lib/ndis/schemas";

export async function POST(req: Request) {
  const user = await requireApiPermission("provider:ndis:claim");
  if (isResponse(user)) return user;

  const parsed = claimFromBookingSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await assertOrgAccess(user, parsed.data.providerOrgId);
    const result = await createClaimLineFromBooking({
      ...parsed.data,
      createdById: user.id,
    });
    return jsonOk(result, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (msg === "BOOKING_NOT_FOUND") return jsonError("Booking not found", 404);
    if (msg === "BOOKING_NOT_COMPLETED") {
      return jsonError("Only completed bookings can be claimed", 400);
    }
    return jsonError(msg, 400);
  }
}
