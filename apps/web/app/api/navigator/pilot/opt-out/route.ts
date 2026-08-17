import { z } from "zod";

import { setAiOptOut } from "@/lib/ai/navigator/passport/service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isNavigatorPassportEnabled,
  isNavigatorPilotEnabled,
} from "@/lib/config/navigator-pilot";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const optOutSchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    passportId: z.string().min(1).optional(),
    sessionId: z.string().min(1).optional(),
  })
  .strict()
  .refine((v) => Boolean(v.passportId || v.sessionId), {
    message: "passportId or sessionId required",
  });

/**
 * Opt out of AI-assisted Navigator path.
 * Retains passport records; continues via classic Provider Finder.
 */
export async function POST(req: Request) {
  if (!isNavigatorPilotEnabled()) {
    return jsonError("NAVIGATOR_PILOT_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`navigator-opt-out:${ip}`, {
      windowMs: 60_000,
      max: 20,
    })
  ) {
    return jsonError("RATE_LIMITED", 429);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = optOutSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  try {
    if (parsed.data.passportId) {
      if (!isNavigatorPassportEnabled()) {
        return jsonError("NAVIGATOR_PASSPORT_DISABLED", 403);
      }
      const passport = await setAiOptOut({
        id: parsed.data.passportId,
        tenantId: parsed.data.tenantId,
        participantId: parsed.data.participantId,
        actorUserId: user.id,
      });
      return jsonOk({
        passport,
        continueVia: "/provider-finder",
      });
    }

    // Session-scoped opt-out: mark matching active passports when passport flag on.
    if (isNavigatorPassportEnabled() && parsed.data.sessionId) {
      await prisma.navigatorDecisionPassport.updateMany({
        where: {
          tenantId: parsed.data.tenantId,
          participantId: parsed.data.participantId,
          sessionId: parsed.data.sessionId,
        },
        data: { aiOptedOut: true },
      });
    }

    return jsonOk({
      continueVia: "/provider-finder",
      sessionId: parsed.data.sessionId ?? null,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "NAVIGATOR_OPT_OUT_ERROR";
    return jsonError(message, message.includes("NOT_FOUND") ? 404 : 400);
  }
}
