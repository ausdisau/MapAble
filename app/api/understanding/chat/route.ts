import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isUnderstandingEnabled } from "@/lib/config/understanding";
import { runUnderstandingAgentTurn } from "@/lib/understanding/understanding-agent";

const requestSchema = z.object({
  query: z.string().min(1).max(4000),
  sessionId: z.string().max(128).optional(),
});

export async function POST(req: Request) {
  if (!isUnderstandingEnabled()) {
    return jsonError("Understanding layer is not enabled", 503);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const participantId = user.id;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await runUnderstandingAgentTurn({
      query: parsed.data.query,
      participantId,
      sessionId: parsed.data.sessionId,
    });
    return jsonOk(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Understanding failed";
    if (message.includes("UNDERSTANDING_DISABLED")) {
      return jsonError("Understanding layer is not enabled", 503);
    }
    if (message.includes("model unavailable") || message.includes("blocked")) {
      return jsonError(message, 503);
    }
    throw e;
  }
}
