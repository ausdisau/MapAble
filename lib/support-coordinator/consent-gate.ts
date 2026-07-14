import { hasParticipantAuthority } from "@/lib/authority/participant-authority-service";
import { prisma } from "@/lib/prisma";

export async function hasActiveConsentForCoordinator(
  participantId: string,
  coordinatorId: string,
) {
  const rel = await prisma.supportCoordinatorRelationship.findUnique({
    where: {
      participantId_coordinatorId: { participantId, coordinatorId },
    },
  });
  return rel?.status === "active";
}

/**
 * Coordinator may act when an active SupportCoordinatorRelationship exists
 * OR when a valid participant authority grant covers support_coordination.
 */
export async function hasCoordinatorAuthority(input: {
  participantId: string;
  coordinatorId: string;
  action?: string;
  tenantId?: string;
}) {
  const relationshipActive = await hasActiveConsentForCoordinator(
    input.participantId,
    input.coordinatorId,
  );
  if (relationshipActive) return true;

  return hasParticipantAuthority({
    participantId: input.participantId,
    actorUserId: input.coordinatorId,
    tenantId: input.tenantId,
    domain: "support_coordination",
    action: input.action ?? "manage",
  });
}

export async function requireCoordinatorAuthority(input: {
  participantId: string;
  coordinatorId: string;
  action?: string;
  tenantId?: string;
}) {
  const allowed = await hasCoordinatorAuthority(input);
  if (!allowed) throw new Error("COORDINATOR_AUTHORITY_REQUIRED");
}
