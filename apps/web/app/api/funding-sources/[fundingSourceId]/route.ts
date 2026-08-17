import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ fundingSourceId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { fundingSourceId } = await params;

  const source = await prisma.participantFundingSource.findUnique({
    where: { id: fundingSourceId },
  });
  if (!source) return jsonError("Not found", 404);
  if (!isAdminRole(user.primaryRole) && source.participantId !== user.id) {
    return jsonError("Forbidden", 403);
  }
  return jsonOk({ fundingSource: source });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ fundingSourceId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { fundingSourceId } = await params;
  const body = await req.json();

  const existing = await prisma.participantFundingSource.findUnique({
    where: { id: fundingSourceId },
  });
  if (!existing) return jsonError("Not found", 404);
  if (!isAdminRole(user.primaryRole) && existing.participantId !== user.id) {
    return jsonError("Forbidden", 403);
  }

  const source = await prisma.participantFundingSource.update({
    where: { id: fundingSourceId },
    data: {
      displayName: body.displayName,
      type: body.type,
      status: isAdminRole(user.primaryRole) ? body.status : undefined,
      notes: body.notes,
      planManagerContactName: body.planManagerContactName,
      planManagerEmail: body.planManagerEmail,
    },
  });

  await createAuditEvent({
    actorUserId: user.id,
    actorRole: user.primaryRole as never,
    action: "funding_source.updated",
    entityType: "ParticipantFundingSource",
    entityId: source.id,
    participantId: source.participantId,
  });

  return jsonOk({ fundingSource: source });
}
