import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { addCareScheduleException } from "@/lib/care/care-recurring-schedule-service";

const bodySchema = z
  .object({
    occurrenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    type: z.enum(["skip", "reschedule"]),
    newStartAt: z.string().datetime().optional(),
    newEndAt: z.string().datetime().optional(),
    reason: z.string().max(500).optional(),
  })
  .strict();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ scheduleId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { scheduleId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const exception = await addCareScheduleException({
      scheduleId,
      actor: user,
      occurrenceDate: new Date(`${parsed.data.occurrenceDate}T00:00:00.000Z`),
      type: parsed.data.type,
      newStartAt: parsed.data.newStartAt
        ? new Date(parsed.data.newStartAt)
        : undefined,
      newEndAt: parsed.data.newEndAt
        ? new Date(parsed.data.newEndAt)
        : undefined,
      reason: parsed.data.reason,
    });
    return jsonOk({ exception }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "FEATURE_DISABLED") {
      return jsonError("Recurring Care schedules are not enabled", 404);
    }
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    if (e instanceof Error && e.message === "RESCHEDULE_REQUIRES_TIMES") {
      return jsonError("Reschedule requires newStartAt and newEndAt", 400);
    }
    return jsonError("Forbidden", 403);
  }
}
