import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { canUserManageCase } from "@/lib/cases/case-access";
import { acknowledgeInsight } from "@/lib/cases/case-service";
import { caseManagementConfig } from "@/lib/config/case-management";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ caseId: string; insightId: string }> },
) {
  if (!caseManagementConfig.enabled)
    return jsonError("Case management is disabled", 404);
  const { caseId, insightId } = await ctx.params;
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const existing = await prisma.case.findUnique({
    where: { id: caseId },
    select: { participantId: true, assignedToId: true, createdById: true },
  });
  if (!existing) return jsonError("Not found", 404);
  if (!canUserManageCase(existing, user.id, user.primaryRole))
    return jsonError("Forbidden", 403);

  const insight = await prisma.caseAIInsight.findUnique({
    where: { id: insightId },
  });
  if (!insight || insight.caseId !== caseId)
    return jsonError("Insight not found", 404);

  const acknowledged = await acknowledgeInsight(insightId, user.id);
  return jsonOk({ insight: acknowledged });
}
