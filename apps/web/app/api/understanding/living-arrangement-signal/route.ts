import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isUnderstandingEnabled } from "@/lib/config/understanding";
import {
  computeLivingArrangementRiskSignal,
  getLivingArrangementRiskSignal,
} from "@/lib/understanding/relationship-risk-service";

const recomputeSchema = z.object({
  recompute: z.literal(true).optional(),
  livingAloneHint: z.boolean().optional(),
});

export async function GET() {
  if (!isUnderstandingEnabled()) {
    return jsonError("Understanding layer is not enabled", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const existing = await getLivingArrangementRiskSignal(user.id);
  if (existing) return jsonOk(existing);
  const computed = await computeLivingArrangementRiskSignal(user.id, {
    persist: true,
  });
  return jsonOk(computed);
}

export async function POST(req: Request) {
  if (!isUnderstandingEnabled()) {
    return jsonError("Understanding layer is not enabled", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown = {};
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = recomputeSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const signal = await computeLivingArrangementRiskSignal(user.id, {
    livingAloneHint: parsed.data.livingAloneHint,
    persist: true,
  });
  return jsonOk(signal);
}
