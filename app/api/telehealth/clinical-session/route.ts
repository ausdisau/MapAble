import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isVirtualCareHubEnabled } from "@/lib/config/strategic-2026";
import { createClinicalSession } from "@/lib/telehealth/clinical-session";
import {
  assertClinicalSessionAccess,
  ClinicalSessionAccessError,
} from "@/lib/telehealth/clinical-session-access";

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

  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const accessRole = await assertClinicalSessionAccess({
      user,
      participantId: parsed.data.participantId,
      workerId: parsed.data.workerId,
      bookingId: parsed.data.bookingId,
      appointmentId: parsed.data.appointmentId,
    });

    const session = await createClinicalSession({
      participantId: parsed.data.participantId,
      workerId: parsed.data.workerId,
      supportItemCode: parsed.data.supportItemCode,
      bookingId: parsed.data.bookingId,
      appointmentId: parsed.data.appointmentId,
      actorUserId: user.id,
      accessRole,
    });
    return jsonOk(session, 201);
  } catch (e) {
    if (e instanceof ClinicalSessionAccessError) {
      return jsonError(e.message, e.status);
    }
    const message =
      e instanceof Error ? e.message : "Clinical session create failed";
    if (message === "VIRTUAL_CARE_HUB_DISABLED") {
      return jsonError("Virtual Care Hub is disabled", 404);
    }
    return jsonError(message, 400);
  }
}
