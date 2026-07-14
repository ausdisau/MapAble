import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { movesRehabilitationConfig } from "@/lib/config/moves-rehabilitation";
import { scheduleActivity } from "@/lib/moves/activities-service";
import {
  addVersion,
  attemptForbiddenClinicalAction,
  createPlan,
  listPendingReviews,
  listPlansForClinician,
  requestReview,
} from "@/lib/moves/plans-service";

const createPlanSchema = z.object({
  participantId: z.string().min(1),
  title: z.string().min(1).max(200),
  initialInstructions: z.record(z.unknown()).optional(),
  changeSummary: z.string().max(2000).optional(),
  goals: z.array(z.string().min(1).max(200)).optional(),
});

const addVersionSchema = z.object({
  planId: z.string().min(1),
  instructionsJson: z.record(z.unknown()),
  changeSummary: z.string().min(1).max(2000),
  approve: z.boolean().optional(),
});

const requestReviewSchema = z.object({
  planId: z.string().min(1),
  notes: z.string().max(5000).optional(),
});

const scheduleActivitySchema = z.object({
  planId: z.string().min(1),
  title: z.string().min(1).max(200),
  scheduledAt: z.string().datetime().optional(),
  instructionsAccessible: z.string().min(1).max(5000),
  equipment: z.array(z.unknown()).optional(),
});

const boundaryTestSchema = z.object({
  action: z.enum([
    "diagnose",
    "prescribe",
    "alter_treatment",
    "increase_intensity",
  ]),
});

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!movesRehabilitationConfig.enabled) {
    return jsonOk({ plans: [], pendingReviews: [] });
  }

  try {
    const [plans, pendingReviews] = await Promise.all([
      listPlansForClinician(user.id),
      listPendingReviews(user.id),
    ]);
    return jsonOk({ plans, pendingReviews });
  } catch (error) {
    if (error instanceof Error && error.message === "CLINICAL_AUTHOR_REQUIRED") {
      return jsonError("Clinical author registration required", 403);
    }
    throw error;
  }
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
      case "create_plan": {
        const parsed = createPlanSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);
        const plan = await createPlan(
          {
            ...parsed.data,
            clinicianAuthorId: user.id,
          },
          user.id,
        );
        return jsonOk({ plan }, 201);
      }
      case "add_version": {
        const parsed = addVersionSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);
        const version = await addVersion(parsed.data, user.id);
        return jsonOk({ version }, 201);
      }
      case "request_review": {
        const parsed = requestReviewSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);
        const review = await requestReview({
          planId: parsed.data.planId,
          reviewerId: user.id,
          notes: parsed.data.notes,
        });
        return jsonOk({ review }, 201);
      }
      case "schedule_activity": {
        const parsed = scheduleActivitySchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);
        const activity = await scheduleActivity(
          {
            ...parsed.data,
            scheduledAt: parsed.data.scheduledAt
              ? new Date(parsed.data.scheduledAt)
              : null,
          },
          user.id,
        );
        return jsonOk({ activity }, 201);
      }
      case "boundary_check": {
        const parsed = boundaryTestSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);
        await attemptForbiddenClinicalAction(parsed.data.action);
        return jsonOk({ allowed: true });
      }
      default:
        return jsonError("Unknown action", 400);
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CLINICAL_AUTHOR_REQUIRED") {
        return jsonError("Clinical author registration required", 403);
      }
      if (error.message.startsWith("CLINICAL_BOUNDARY_VIOLATION:")) {
        return jsonError("Clinical boundary violation — action not permitted", 403);
      }
      if (error.message === "REHABILITATION_PLAN_NOT_FOUND") {
        return jsonError("Plan not found", 404);
      }
    }
    throw error;
  }
}
