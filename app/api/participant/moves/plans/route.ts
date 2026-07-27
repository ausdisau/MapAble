import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { movesRehabilitationConfig } from "@/lib/config/moves-rehabilitation";
import {
  completeActivity,
  listTodayActivities,
  markActivityMissed,
} from "@/lib/moves/activities-service";
import {
  acknowledgePlanVersion,
  listPlansForParticipant,
  updatePlanStatus,
} from "@/lib/moves/plans-service";

const completeSchema = z.object({
  activityId: z.string().min(1),
  completionNote: z.string().max(2000).optional(),
  participantFeedback: z.string().max(2000).optional(),
});

const acknowledgeSchema = z.object({
  planVersionId: z.string().min(1),
});

const pauseSchema = z.object({
  planId: z.string().min(1),
});

const missSchema = z.object({
  activityId: z.string().min(1),
  followUpNote: z.string().max(2000).optional(),
});

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!movesRehabilitationConfig.enabled) {
    return jsonOk({ plans: [], todayActivities: [] });
  }

  const [plans, todayActivities] = await Promise.all([
    listPlansForParticipant(user.id),
    listTodayActivities(user.id),
  ]);

  return jsonOk({ plans, todayActivities });
}

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!movesRehabilitationConfig.enabled) {
    return jsonError("Moves rehabilitation is disabled", 404);
  }

  const body = await request.json();
  const action = body?.action as string | undefined;

  try {
    switch (action) {
      case "acknowledge": {
        const parsed = acknowledgeSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);
        const acknowledgement = await acknowledgePlanVersion({
          planVersionId: parsed.data.planVersionId,
          participantId: user.id,
        });
        return jsonOk({ acknowledgement });
      }
      case "pause_plan": {
        const parsed = pauseSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);
        const plan = await updatePlanStatus({
          planId: parsed.data.planId,
          status: "paused",
          actorUserId: user.id,
        });
        return jsonOk({ plan });
      }
      default:
        return jsonError("Unknown action", 400);
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PLAN_VERSION_NOT_FOUND") {
        return jsonError("Plan version not found", 404);
      }
      if (error.message === "PARTICIPANT_MISMATCH") {
        return jsonError("Forbidden", 403);
      }
      if (error.message === "REHABILITATION_PLAN_NOT_FOUND") {
        return jsonError("Plan not found", 404);
      }
      if (error.message === "UNAUTHORISED") {
        return jsonError("Forbidden", 403);
      }
    }
    throw error;
  }
}

export async function PATCH(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!movesRehabilitationConfig.enabled) {
    return jsonError("Moves rehabilitation is disabled", 404);
  }

  const body = await request.json();
  const action = body?.action as string | undefined;

  try {
    switch (action) {
      case "complete_activity": {
        const parsed = completeSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);
        const result = await completeActivity({
          activityId: parsed.data.activityId,
          participantId: user.id,
          completionNote: parsed.data.completionNote,
          participantFeedback: parsed.data.participantFeedback,
        });
        return jsonOk(result);
      }
      case "miss_activity": {
        const parsed = missSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);
        const activity = await markActivityMissed({
          activityId: parsed.data.activityId,
          actorUserId: user.id,
          followUpNote: parsed.data.followUpNote,
        });
        return jsonOk({ activity });
      }
      default:
        return jsonError("Unknown action", 400);
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ACTIVITY_NOT_FOUND") {
        return jsonError("Activity not found", 404);
      }
      if (error.message === "PARTICIPANT_MISMATCH") {
        return jsonError("Forbidden", 403);
      }
      if (error.message === "ACTIVITY_CANCELLED") {
        return jsonError("Activity is cancelled", 409);
      }
    }
    throw error;
  }
}
