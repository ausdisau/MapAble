import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { canUserManageCase } from "@/lib/cases/case-access";
import { addCaseTask } from "@/lib/cases/case-service";
import { caseManagementConfig } from "@/lib/config/case-management";
import { prisma } from "@/lib/prisma";

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

const TaskSchema = z.object({
  title: z.string().min(2).max(200),
  details: z.string().max(5_000).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  aiSuggested: z.boolean().optional(),
});

export async function POST(
  req: Request,
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
  if (!canUserManageCase(existing, user.id, user.primaryRole))
    return jsonError("Forbidden", 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = TaskSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const task = await addCaseTask(caseId, user.id, {
    title: parsed.data.title,
    details: parsed.data.details,
    priority: parsed.data.priority,
    assigneeId: parsed.data.assigneeId,
    dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
    aiSuggested: parsed.data.aiSuggested ?? false,
  });
  return jsonOk({ task }, 201);
}
