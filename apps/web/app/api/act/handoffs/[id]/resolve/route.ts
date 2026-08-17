import { z } from "zod";

import { isA2hHandoffEnabled } from "@/lib/act/flags";
import { resolveActHandoff } from "@/lib/act/handoff/service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";

export const runtime = "nodejs";

const resolveSchema = z
  .object({
    decision: z.enum(["approve", "deny"]),
    note: z.string().max(2000).optional(),
    tenantId: z.string().min(1).optional(),
  })
  .strict();

type Ctx = { params: Promise<{ id: string }> };

/**
 * Human resolve for Act A2H handoffs.
 * Actor is taken from the session — never from the client body.
 */
export async function POST(req: Request, ctx: Ctx) {
  if (!isA2hHandoffEnabled()) {
    return jsonError("MAPABLE_A2H_HANDOFF_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (!checkIpRateLimit(`act-handoff-resolve:${ip}`, { windowMs: 60_000, max: 30 })) {
    return jsonError("RATE_LIMITED", 429);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const role = user.primaryRole;
  const canResolve =
    isAdminRole(role) ||
    role === "support_coordinator" ||
    role === "plan_manager";
  if (!canResolve) {
    return jsonError("FORBIDDEN", 403);
  }

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const handoff = await resolveActHandoff({
      handoffId: id,
      actorUserId: user.id,
      decision: parsed.data.decision,
      note: parsed.data.note,
      tenantId: parsed.data.tenantId,
    });
    return jsonOk({
      handoff,
      memory:
        parsed.data.decision === "approve" ? "HITL_APPROVED" : "HITL_REJECTED",
      executed: false,
      message:
        "Handoff resolved. Tool may be retried under approved memory — billing writes are never auto-executed.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ACT_HANDOFF_ERROR";
    if (message === "ACT_HANDOFF_NOT_FOUND") {
      return jsonError(message, 404);
    }
    if (
      message === "ACT_HANDOFF_FORBIDDEN" ||
      message === "ACT_HANDOFF_TENANT_MISMATCH"
    ) {
      return jsonError(message, 403);
    }
    return jsonError(message, 400);
  }
}
