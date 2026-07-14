import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createEmploymentGoal,
  listEmploymentGoals,
  updateEmploymentGoal,
} from "@/lib/jobs/goals/employment-goals-service";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z
    .enum([
      "skills_development",
      "employment_type",
      "hours_and_schedule",
      "location_and_access",
      "disclosure_and_support",
      "other",
    ])
    .optional(),
  targetDate: z.string().datetime().optional(),
});

const updateSchema = createSchema.partial().extend({
  goalId: z.string(),
  status: z.enum(["active", "achieved", "paused", "archived"]).optional(),
});

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    return jsonOk({ goals: await listEmploymentGoals(user.id) });
  } catch (e) {
    if (e instanceof Error && e.message === "JOBS_PARTICIPATION_DISABLED") {
      return jsonError("Jobs participation is unavailable", 503);
    }
    return jsonError("Failed to load goals", 500);
  }
}

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    return jsonOk(
      {
        goal: await createEmploymentGoal({
          participantId: user.id,
          actorUserId: user.id,
          title: parsed.data.title,
          description: parsed.data.description,
          category: parsed.data.category,
          targetDate: parsed.data.targetDate
            ? new Date(parsed.data.targetDate)
            : undefined,
        }),
      },
      201,
    );
  } catch (e) {
    if (e instanceof Error && e.message === "JOBS_PARTICIPATION_DISABLED") {
      return jsonError("Jobs participation is unavailable", 503);
    }
    return jsonError("Failed to create goal", 500);
  }
}

export async function PATCH(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    return jsonOk({
      goal: await updateEmploymentGoal({
        goalId: parsed.data.goalId,
        participantId: user.id,
        actorUserId: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        targetDate: parsed.data.targetDate
          ? new Date(parsed.data.targetDate)
          : parsed.data.targetDate === undefined
            ? undefined
            : null,
        status: parsed.data.status,
      }),
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "GOAL_NOT_FOUND") return jsonError("Goal not found", 404);
      if (e.message === "JOBS_PARTICIPATION_DISABLED") {
        return jsonError("Jobs participation is unavailable", 503);
      }
    }
    return jsonError("Failed to update goal", 500);
  }
}
