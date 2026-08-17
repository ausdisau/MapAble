import { ZodError } from "zod";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { assignTransportOperator } from "@/lib/transport/transport-booking-service";
import { assignOperatorSchema } from "@/lib/validation/transport";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { transportBookingId } = await params;
  try {
    const { organisationId } = assignOperatorSchema.parse(await req.json());
    const booking = await assignTransportOperator(
      transportBookingId,
      organisationId,
      user.id
    );
    return jsonOk({ booking });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Assign failed", 500);
  }
}
