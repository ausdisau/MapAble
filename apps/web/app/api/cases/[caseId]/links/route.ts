import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { canUserManageCase } from "@/lib/cases/case-access";
import { addCaseLink } from "@/lib/cases/case-service";
import { caseManagementConfig } from "@/lib/config/case-management";
import { prisma } from "@/lib/prisma";

const LINK_TYPES = [
  "booking",
  "incident",
  "support_ticket",
  "document",
  "funding_source",
  "service_agreement",
  "external",
  "note",
] as const;

const Schema = z.object({
  linkType: z.enum(LINK_TYPES),
  label: z.string().min(2).max(200),
  targetId: z.string().max(200).nullable().optional(),
  url: z.string().url().max(2_000).nullable().optional(),
  notes: z.string().max(2_000).nullable().optional(),
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
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const link = await addCaseLink(caseId, user.id, parsed.data);
  return jsonOk({ link }, 201);
}
