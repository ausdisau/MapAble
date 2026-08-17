import { z } from "zod";

import { calculateBehavioralRiskIndex } from "@/lib/ai/behavioral-risk-matrix";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { apiForbidden } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { isBehavioralRiskEnabled } from "@/lib/config/strategic-2026";

const QuerySchema = z.object({
  participantId: z.string().min(1),
});

export async function GET(req: Request) {
  if (!isBehavioralRiskEnabled()) {
    return jsonError("Behavioral risk matrix is disabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const allowed =
    isAdminRole(user.primaryRole) ||
    user.primaryRole === "support_coordinator";
  if (!allowed) return apiForbidden();

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    participantId: url.searchParams.get("participantId"),
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await calculateBehavioralRiskIndex(parsed.data.participantId);
    return jsonOk(result);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Risk score failed",
      400
    );
  }
}
