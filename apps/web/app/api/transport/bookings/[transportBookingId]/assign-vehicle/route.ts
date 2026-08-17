import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { assignVehicleToTransport } from "@/lib/transport/driver-service";
import { assignVehicleSchema } from "@/lib/validation/transport";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> }
) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  const { transportBookingId } = await params;
  try {
    const { vehicleId } = assignVehicleSchema.parse(await req.json());
    const booking = await assignVehicleToTransport(
      transportBookingId,
      vehicleId,
      user.id
    );
    return jsonOk({ booking });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Assign failed", 500);
  }
}
