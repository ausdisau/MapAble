import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { apiForbidden } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { isVirtualCareHubEnabled } from "@/lib/config/strategic-2026";
import { createClinicalSession } from "@/lib/telehealth/clinical-session";

const BodySchema = z.object({
  participantId: z.string().min(1),
  workerId: z.string().min(1).optional(),
  supportItemCode: z.string().min(1),
  bookingId: z.string().min(1).optional(),
  appointmentId: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  if (!isVirtualCareHubEnabled()) {
    return jsonError("Virtual Care Hub is disabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const allowed =
    hasPermission(user.primaryRole, "care:shift:work") ||
    hasPermission(user.primaryRole, "provider:booking:respond") ||
    hasPermission(user.primaryRole, "booking:create");
  if (!allowed) return apiForbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const session = await createClinicalSession({
      participantId: parsed.data.participantId,
      workerId: parsed.data.workerId,
      supportItemCode: parsed.data.supportItemCode,
      bookingId: parsed.data.bookingId,
      appointmentId: parsed.data.appointmentId,
      actorUserId: user.id,
    });
    return jsonOk(session, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Clinical session create failed";
    if (message === "VIRTUAL_CARE_HUB_DISABLED") {
      return jsonError("Virtual Care Hub is disabled", 404);
    }
    return jsonError(message, 400);
  }
}
