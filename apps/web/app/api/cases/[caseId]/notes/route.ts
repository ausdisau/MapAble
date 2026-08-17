import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { canUserManageCase } from "@/lib/cases/case-access";
import { addCaseNote } from "@/lib/cases/case-service";
import { caseManagementConfig } from "@/lib/config/case-management";
import { prisma } from "@/lib/prisma";

const NoteSchema = z.object({
  body: z.string().min(1).max(20_000),
  isPrivate: z.boolean().optional(),
  pinned: z.boolean().optional(),
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
  const parsed = NoteSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const note = await addCaseNote(caseId, user.id, parsed.data.body, {
    isPrivate: parsed.data.isPrivate,
    pinned: parsed.data.pinned,
  });
  return jsonOk({ note }, 201);
}
