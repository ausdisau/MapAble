import { z } from "zod";

import { getEscalationStatus } from "@/lib/ai/navigator/escalation/service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isNavigatorPilotEnabled } from "@/lib/config/navigator-pilot";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const getQuerySchema = z.object({
  tenantId: z.string().min(1),
});

export async function GET(req: Request, ctx: Ctx) {
  if (!isNavigatorPilotEnabled()) {
    return jsonError("NAVIGATOR_PILOT_DISABLED", 403);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await ctx.params;
  const url = new URL(req.url);
  const parsed = getQuerySchema.safeParse({
    tenantId: url.searchParams.get("tenantId"),
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const escalation = await getEscalationStatus({
      id,
      tenantId: parsed.data.tenantId,
      actorUserId: user.id,
    });
    if (!escalation) {
      return jsonError("NAVIGATOR_ESCALATION_NOT_FOUND", 404);
    }
    return jsonOk({ escalation });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "NAVIGATOR_ESCALATION_ERROR";
    return jsonError(message, 400);
  }
}
