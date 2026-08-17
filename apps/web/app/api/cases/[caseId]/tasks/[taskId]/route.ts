import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { canUserManageCase } from "@/lib/cases/case-access";
import { updateCaseTask } from "@/lib/cases/case-service";
import { caseManagementConfig } from "@/lib/config/case-management";
import { prisma } from "@/lib/prisma";

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const STATUSES = [
  "pending",
  "in_progress",
  "blocked",
  "done",
  "cancelled",
] as const;

const Schema = z.object({
  status: z.enum(STATUSES).optional(),
  title: z.string().min(2).max(200).optional(),
  details: z.string().max(5_000).nullable().optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ caseId: string; taskId: string }> },
) {
  if (!caseManagementConfig.enabled)
    return jsonError("Case management is disabled", 404);
  const { caseId, taskId } = await ctx.params;
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const existing = await prisma.case.findUnique({
    where: { id: caseId },
    select: { participantId: true, assignedToId: true, createdById: true },
  });
  if (!existing) return jsonError("Not found", 404);
  if (!canUserManageCase(existing, user.id, user.primaryRole))
    return jsonError("Forbidden", 403);

  const task = await prisma.caseTask.findUnique({ where: { id: taskId } });
  if (!task || task.caseId !== caseId) return jsonError("Task not found", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const updated = await updateCaseTask(taskId, user.id, {
    ...parsed.data,
    dueAt:
      parsed.data.dueAt === undefined
        ? undefined
        : parsed.data.dueAt
          ? new Date(parsed.data.dueAt)
          : null,
  });
  return jsonOk({ task: updated });
}
