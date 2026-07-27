import { requireApiSession } from "@/lib/api/auth-handler";
import {
  isResponse,
  jsonError,
  jsonOk,
  zodErrorResponse,
} from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isAdminRole } from "@/lib/auth/roles";
import {
  assertCanManageParticipantProviderRelationship,
} from "@/lib/ndis/participant-provider-relationship-service";
import { patchParticipantProviderRelationshipSchema } from "@/lib/ndis/schemas";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;

  const { id } = await params;
  const parsed = patchParticipantProviderRelationshipSchema.safeParse(
    await req.json()
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await prisma.participantProviderRelationship.findUnique({
    where: { id },
  });
  if (!existing) return jsonError("Relationship not found", 404);

  if (
    parsed.data.status === "active" &&
    !isAdminRole(user.primaryRole) &&
    user.id !== existing.participantId
  ) {
    return jsonError(
      "Only the participant or a platform admin can activate My Provider.",
      403
    );
  }

  try {
    await assertCanManageParticipantProviderRelationship(
      user,
      existing.participantId,
      existing.providerOrgId
    );

    const updated = await prisma.participantProviderRelationship.update({
      where: { id },
      data: {
        status: parsed.data.status,
        notes: parsed.data.notes ?? existing.notes,
        myProviderVerifiedAt:
          parsed.data.status === "active"
            ? new Date()
            : existing.myProviderVerifiedAt,
      },
    });

    await createAuditEvent({
      actorUserId: user.id,
      action: "participant_provider_relationship.updated",
      entityType: "ParticipantProviderRelationship",
      entityId: updated.id,
      participantId: updated.participantId,
      organisationId: updated.providerOrgId,
      metadata: { status: updated.status },
    });

    return jsonOk({ relationship: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError(msg, 400);
  }
}
