import { z } from "zod";

import {
  requireApiPermission,
  requireApiSession,
} from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { caseListWhereForUser } from "@/lib/cases/case-access";
import { createCase } from "@/lib/cases/case-service";
import { caseManagementConfig } from "@/lib/config/case-management";
import { prisma } from "@/lib/prisma";

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

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

const CreateSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(10_000).optional(),
  category: z.enum(CATEGORIES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  participantId: z.string().cuid().nullable().optional(),
  assignedToId: z.string().cuid().nullable().optional(),
  organisationId: z.string().cuid().nullable().optional(),
  tags: z.array(z.string().max(48)).max(20).optional(),
  goals: z.array(z.string().max(200)).max(20).optional(),
  dueAt: z.string().datetime().optional(),
});

function disabledResponse() {
  return jsonError("Case management is disabled", 404);
}

export async function GET() {
  if (!caseManagementConfig.enabled) return disabledResponse();
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const where = caseListWhereForUser(user.id, user.primaryRole);
  const cases = await prisma.case.findMany({
    where,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      participant: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      _count: { select: { notes: true, tasks: true, insights: true } },
    },
  });

  return jsonOk({ cases });
}

export async function POST(req: Request) {
  if (!caseManagementConfig.enabled) return disabledResponse();
  const user = await requireApiPermission("case:manage:self");
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const created = await createCase(
    {
      ...parsed.data,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
    },
    user.id,
  );

  return jsonOk({ case: created }, 201);
}
