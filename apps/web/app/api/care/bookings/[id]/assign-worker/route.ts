import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { assignWorkerToCareBooking } from "@/lib/care/care-assignment-service";
import { assignCareWorkerSchema } from "@/lib/validation/care";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const parsed = assignCareWorkerSchema.parse(await req.json());
    const result = await assignWorkerToCareBooking({
      careBookingId: id,
      workerProfileId: parsed.workerProfileId,
      actorUser: user,
      startAt: parsed.startAt ? new Date(parsed.startAt) : undefined,
      endAt: parsed.endAt ? new Date(parsed.endAt) : undefined,
    });
    return jsonOk(result);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error) {
      if (e.message === "NOT_FOUND") return jsonError("Not found", 404);
      if (
        e.message.startsWith("WORKER_") ||
        e.message === "HIGH_INTENSITY_COMPETENCY_REQUIRED"
      ) {
        return jsonError(e.message, 400);
      }
    }
    return jsonError("Assignment failed", 403);
  }
}
