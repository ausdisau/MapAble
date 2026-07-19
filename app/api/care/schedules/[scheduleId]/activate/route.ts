import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { activateCareRecurringSchedule } from "@/lib/care/care-recurring-schedule-service";

const bodySchema = z
  .object({
    amendAgreement: z.boolean().optional(),
    agreementReason: z.string().min(4).max(500).optional(),
  })
  .strict();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ scheduleId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { scheduleId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const schedule = await activateCareRecurringSchedule({
      scheduleId,
      actor: user,
      amendAgreement: parsed.data.amendAgreement,
      agreementReason: parsed.data.agreementReason,
    });
    return jsonOk({ schedule });
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
