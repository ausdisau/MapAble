import { randomBytes } from "node:crypto";

import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isNavigatorPilotEnabled } from "@/lib/config/navigator-pilot";

export const runtime = "nodejs";

const createSessionSchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
  })
  .strict();

/** Opaque cuid-like session id (no extra dependency). */
function createNavigatorSessionId(): string {
  const time = Date.now().toString(36);
  const rand = randomBytes(10).toString("hex");
  return `c${time}${rand}`;
}

/**
 * Start a Navigator pilot session. Auth required; pilot flag must be on.
 * Does not enable matching or model assistance by itself.
 */
export async function POST(req: Request) {
  if (!isNavigatorPilotEnabled()) {
    return jsonError("NAVIGATOR_PILOT_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`navigator-pilot-session:${ip}`, {
      windowMs: 60_000,
      max: 30,
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

  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  const sessionId = createNavigatorSessionId();
  return jsonOk({
    sessionId,
    tenantId: parsed.data.tenantId,
    participantId: parsed.data.participantId,
    createdAt: new Date().toISOString(),
  });
}
