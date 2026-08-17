import { z } from "zod";

import {
  challengeDecisionPassport,
  correctDecisionPassport,
  getDecisionPassport,
  rejectSuggestion,
  setAiOptOut,
} from "@/lib/ai/navigator/passport/service";
import {
  hardConstraintsSchema,
  passportInterpretationSchema,
  rankingWeightsSchema,
} from "@/lib/ai/navigator/passport/types";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isNavigatorPassportEnabled } from "@/lib/config/navigator-pilot";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const getQuerySchema = z.object({
  tenantId: z.string().min(1),
  participantId: z.string().min(1),
});

const patchSchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    action: z.enum(["correct", "challenge", "reject", "opt_out"]),
    interpretation: passportInterpretationSchema.optional(),
    hardConstraints: hardConstraintsSchema.optional(),
    rankingWeights: rankingWeightsSchema.optional(),
    note: z.string().max(1000).optional(),
    shortlistItemId: z.string().min(1).max(120).optional(),
    reason: z.string().max(500).optional(),
  })
  .strict();

export async function GET(req: Request, ctx: Ctx) {
  if (!isNavigatorPassportEnabled()) {
    return jsonError("NAVIGATOR_PASSPORT_DISABLED", 403);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await ctx.params;
  const url = new URL(req.url);
  const parsed = getQuerySchema.safeParse({
    tenantId: url.searchParams.get("tenantId"),
    participantId: url.searchParams.get("participantId"),
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  const passport = await getDecisionPassport({
    id,
    tenantId: parsed.data.tenantId,
    participantId: parsed.data.participantId,
  });
  if (!passport) {
    return jsonError("NAVIGATOR_PASSPORT_NOT_FOUND", 404);
  }

  return jsonOk({ passport });
}

export async function PATCH(req: Request, ctx: Ctx) {
  if (!isNavigatorPassportEnabled()) {
    return jsonError("NAVIGATOR_PASSPORT_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`navigator-passport-patch:${ip}`, {
      windowMs: 60_000,
      max: 30,
    })
  ) {
    return jsonError("RATE_LIMITED", 429);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  try {
    switch (parsed.data.action) {
      case "correct": {
        const passport = await correctDecisionPassport({
          id,
          tenantId: parsed.data.tenantId,
          participantId: parsed.data.participantId,
          actorUserId: user.id,
          interpretation: parsed.data.interpretation,
          hardConstraints: parsed.data.hardConstraints,
          rankingWeights: parsed.data.rankingWeights,
          note: parsed.data.note,
        });
        return jsonOk({ passport });
      }
      case "challenge": {
        const passport = await challengeDecisionPassport({
          id,
          tenantId: parsed.data.tenantId,
          participantId: parsed.data.participantId,
          actorUserId: user.id,
          note: parsed.data.note,
        });
        return jsonOk({ passport });
      }
      case "reject": {
        const passport = await rejectSuggestion({
          id,
          tenantId: parsed.data.tenantId,
          participantId: parsed.data.participantId,
          actorUserId: user.id,
          shortlistItemId: parsed.data.shortlistItemId,
          reason: parsed.data.reason ?? parsed.data.note,
        });
        return jsonOk({ passport });
      }
      case "opt_out": {
        const passport = await setAiOptOut({
          id,
          tenantId: parsed.data.tenantId,
          participantId: parsed.data.participantId,
          actorUserId: user.id,
        });
        return jsonOk({
          passport,
          continueVia: "/provider-finder",
        });
      }
      default: {
        const _exhaustive: never = parsed.data.action;
        return jsonError(`UNKNOWN_ACTION:${String(_exhaustive)}`, 400);
      }
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "NAVIGATOR_PASSPORT_ERROR";
    return jsonError(message, message.includes("NOT_FOUND") ? 404 : 400);
  }
}
