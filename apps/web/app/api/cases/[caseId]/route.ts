import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { canUserAccessCase, canUserManageCase } from "@/lib/cases/case-access";
import { updateCase } from "@/lib/cases/case-service";
import { caseManagementConfig } from "@/lib/config/case-management";
import { prisma } from "@/lib/prisma";

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const STATUSES = ["open", "monitoring", "on_hold", "closed"] as const;
const RISK = ["low", "moderate", "elevated", "high", "critical"] as const;
const CATEGORIES = [
  "intake",
  "goal_planning",
  "service_coordination",
  "funding_review",
  "safeguarding",
  "housing",
  "health",
  "employment",
  "education",
  "legal",
  "other",
] as const;

const UpdateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(10_000).optional(),
  category: z.enum(CATEGORIES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  status: z.enum(STATUSES).optional(),
  riskLevel: z.enum(RISK).optional(),
  participantId: z.string().cuid().nullable().optional(),
  assignedToId: z.string().cuid().nullable().optional(),
  tags: z.array(z.string().max(48)).max(20).optional(),
  goals: z.array(z.string().max(200)).max(20).optional(),
  dueAt: z.string().datetime().nullable().optional(),
});

function disabled() {
  return jsonError("Case management is disabled", 404);
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ caseId: string }> },
) {
  if (!caseManagementConfig.enabled) return disabled();
  const { caseId } = await ctx.params;
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const row = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      notes: { orderBy: { createdAt: "asc" } },
      tasks: { orderBy: { createdAt: "asc" } },
      links: { orderBy: { createdAt: "asc" } },
      insights: { orderBy: { createdAt: "desc" } },
      participant: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
  if (!row) return jsonError("Not found", 404);
  if (!canUserAccessCase(row, user.id, user.primaryRole))
    return jsonError("Forbidden", 403);

  return jsonOk({ case: row });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ caseId: string }> },
) {
  if (!caseManagementConfig.enabled) return disabled();
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
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const updated = await updateCase(
    caseId,
    {
      ...parsed.data,
      dueAt:
        parsed.data.dueAt === undefined
          ? undefined
          : parsed.data.dueAt
            ? new Date(parsed.data.dueAt)
            : null,
    },
    user.id,
  );
  return jsonOk({ case: updated });
}
