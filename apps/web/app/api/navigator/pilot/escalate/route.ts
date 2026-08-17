import { z } from "zod";

import {
  createNavigatorEscalation,
  NAVIGATOR_ESCALATION_REASONS,
} from "@/lib/ai/navigator/escalation/service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isNavigatorPilotEnabled } from "@/lib/config/navigator-pilot";

export const runtime = "nodejs";

const escalateSchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    reason: z.enum(NAVIGATOR_ESCALATION_REASONS),
    sessionId: z.string().min(1).optional(),
    passportId: z.string().min(1).optional(),
    note: z.string().max(1000).optional(),
  })
  .strict();

export async function POST(req: Request) {
  if (!isNavigatorPilotEnabled()) {
    return jsonError("NAVIGATOR_PILOT_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`navigator-escalate:${ip}`, {
      windowMs: 60_000,
      max: 15,
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

  const parsed = escalateSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  try {
    const escalation = await createNavigatorEscalation({
      tenantId: parsed.data.tenantId,
      participantId: parsed.data.participantId,
      actorUserId: user.id,
      reason: parsed.data.reason,
      sessionId: parsed.data.sessionId,
      passportId: parsed.data.passportId,
      note: parsed.data.note,
    });
    return jsonOk({ escalation });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "NAVIGATOR_ESCALATION_ERROR";
    const status = message.includes("TENANT_REQUIRED") ? 400 : 400;
    return jsonError(message, status);
  }
}
