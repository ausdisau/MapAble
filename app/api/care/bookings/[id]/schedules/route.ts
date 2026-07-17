import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createCareRecurringSchedule,
  listCareRecurringSchedulesForBooking,
} from "@/lib/care/care-recurring-schedule-service";

const createSchema = z
  .object({
    frequency: z.enum(["weekly", "fortnightly"]),
    byWeekday: z.array(z.number().int().min(1).max(7)).min(1),
    startTimeLocal: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/),
    endTimeLocal: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/),
    timezone: z.string().min(1).max(80).optional(),
    effectiveFrom: z.string().datetime(),
    effectiveTo: z.string().datetime().optional(),
  })
  .strict();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const schedules = await listCareRecurringSchedulesForBooking(id, user);
    return jsonOk({ schedules });
  } catch (e) {
    if (e instanceof Error && e.message === "FEATURE_DISABLED") {
      return jsonError("Recurring Care schedules are not enabled", 404);
    }
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    return jsonError("Forbidden", 403);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const schedule = await createCareRecurringSchedule({
      careBookingId: id,
      actor: user,
      frequency: parsed.data.frequency,
      byWeekday: parsed.data.byWeekday,
      startTimeLocal: parsed.data.startTimeLocal,
      endTimeLocal: parsed.data.endTimeLocal,
      timezone: parsed.data.timezone,
      effectiveFrom: new Date(parsed.data.effectiveFrom),
      effectiveTo: parsed.data.effectiveTo
        ? new Date(parsed.data.effectiveTo)
        : undefined,
    });
    return jsonOk({ schedule }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "FEATURE_DISABLED") {
      return jsonError("Recurring Care schedules are not enabled", 404);
    }
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    if (e instanceof Error && e.message === "INVALID_WEEKDAY") {
      return jsonError("Invalid weekday list", 400);
    }
    if (e instanceof Error && e.message === "INVALID_TIME") {
      return jsonError("Invalid local time", 400);
    }
    return jsonError("Forbidden", 403);
  }
}
