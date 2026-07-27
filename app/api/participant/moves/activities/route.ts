import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { movesRehabilitationConfig } from "@/lib/config/moves-rehabilitation";
import {
  completeActivity,
  listTodayActivities,
} from "@/lib/moves/activities-service";

const completeSchema = z.object({
  activityId: z.string().min(1),
  completionNote: z.string().max(2000).optional(),
  participantFeedback: z.string().max(2000).optional(),
});

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!movesRehabilitationConfig.enabled) {
    return jsonOk({ todayActivities: [] });
  }

  return jsonOk({ todayActivities: await listTodayActivities(user.id) });
}

export async function PATCH(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!movesRehabilitationConfig.enabled) {
    return jsonError("Moves rehabilitation is disabled", 404);
  }

  const parsed = completeSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await completeActivity({
      activityId: parsed.data.activityId,
      participantId: user.id,
      completionNote: parsed.data.completionNote,
      participantFeedback: parsed.data.participantFeedback,
    });
    return jsonOk(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ACTIVITY_NOT_FOUND") {
        return jsonError("Activity not found", 404);
      }
      if (error.message === "PARTICIPANT_MISMATCH") {
        return jsonError("Forbidden", 403);
      }
    }
    throw error;
  }
}
