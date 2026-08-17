import { z } from "zod";

import {
  requireApiPermission,
  requireApiSession,
} from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { canUserAccessCase } from "@/lib/cases/case-access";
import { runCaseAI } from "@/lib/cases/case-service";
import { caseManagementConfig } from "@/lib/config/case-management";
import { prisma } from "@/lib/prisma";

const KINDS = ["summary", "risk_assessment", "next_action"] as const;

const Schema = z.object({
  kind: z.enum(KINDS),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ caseId: string }> },
) {
  if (!caseManagementConfig.enabled)
    return jsonError("Case management is disabled", 404);
  if (!caseManagementConfig.aiEnabled)
    return jsonError("Case AI is disabled", 503);

  const { caseId } = await ctx.params;
  const user = await requireApiPermission("case:ai:run");
  if (user instanceof Response) return user;

  const existing = await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      participantId: true,
      assignedToId: true,
      createdById: true,
      aiOptOut: true,
    },
  });
  if (!existing) return jsonError("Not found", 404);
  if (existing.aiOptOut)
    return jsonError("Case has opted out of AI analysis", 403);
  if (!canUserAccessCase(existing, user.id, user.primaryRole))
    return jsonError("Forbidden", 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const insight = await runCaseAI(caseId, parsed.data.kind, user.id);
  return jsonOk({ insight }, 201);
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ caseId: string }> },
) {
  if (!caseManagementConfig.enabled)
    return jsonError("Case management is disabled", 404);
  const { caseId } = await ctx.params;
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const existing = await prisma.case.findUnique({
    where: { id: caseId },
    select: { participantId: true, assignedToId: true, createdById: true },
  });
  if (!existing) return jsonError("Not found", 404);
  if (!canUserAccessCase(existing, user.id, user.primaryRole))
    return jsonError("Forbidden", 403);

  const insights = await prisma.caseAIInsight.findMany({
    where: { caseId },
    orderBy: { createdAt: "desc" },
  });
  return jsonOk({ insights });
}
