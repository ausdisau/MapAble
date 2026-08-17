import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import {
  assertCanAccessParticipantData,
  ParticipantAccessError,
} from "@/lib/prms/participant-access";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const participantId = new URL(req.url).searchParams.get("participantId");
  const where = isAdminRole(user.primaryRole)
    ? participantId
      ? { participantId }
      : {}
    : { participantId: user.id };

  const sources = await prisma.participantFundingSource.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return jsonOk({ fundingSources: sources });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();

  const participantId = body.participantId ?? user.id;

  try {
    await assertCanAccessParticipantData(user, participantId);
  } catch (e) {
    if (e instanceof ParticipantAccessError) {
      return jsonError(e.message, 403);
    }
    throw e;
  }

  const source = await prisma.participantFundingSource.create({
    data: {
      participantId,
      type: body.type,
      displayName: body.displayName,
      status: "pending_review",
      planManagerOrganisationId: body.planManagerOrganisationId,
      planManagerContactName: body.planManagerContactName,
      planManagerEmail: body.planManagerEmail,
      planStartDate: body.planStartDate
        ? new Date(body.planStartDate)
        : undefined,
      planEndDate: body.planEndDate ? new Date(body.planEndDate) : undefined,
      notes: body.notes,
      createdById: user.id,
    },
  });

  await createAuditEvent({
    actorUserId: user.id,
    actorRole: user.primaryRole as never,
    action: "funding_source.created",
    entityType: "ParticipantFundingSource",
    entityId: source.id,
    participantId: source.participantId,
  });

  return jsonOk({ fundingSource: source }, 201);
}
