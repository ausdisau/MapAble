import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createStepUpChallenge,
  satisfyStepUpChallenge,
} from "@/lib/identity/identity-security-service";

const createSchema = z.object({
  purpose: z.string().min(1).max(200),
  ttlMinutes: z.number().int().min(1).max(60).optional(),
});

const satisfySchema = z.object({
  challengeId: z.string().min(1),
});

export async function POST(request: Request) {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const challenge = await createStepUpChallenge({
      userId: actor.id,
      purpose: parsed.data.purpose,
      ttlMinutes: parsed.data.ttlMinutes,
    });
    return jsonOk({ challenge }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Challenge failed";
    if (message === "STEP_UP_DISABLED") {
      return jsonError("Step-up authentication is not enabled", 404);
    }
    return jsonError(message, 400);
  }
}

export async function PUT(request: Request) {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;

  const parsed = satisfySchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const challenge = await satisfyStepUpChallenge({
      userId: actor.id,
      challengeId: parsed.data.challengeId,
    });
    return jsonOk({ challenge });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Satisfy failed";
    if (message === "STEP_UP_CHALLENGE_INVALID") {
      return jsonError("Challenge is invalid or expired", 400);
    }
    return jsonError(message, 400);
  }
}
