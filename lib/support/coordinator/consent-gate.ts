import { prisma } from "@/lib/prisma";

export async function hasActiveConsentForCoordinator(
  participantId: string,
  coordinatorId: string
) {
  const rel = await prisma.supportCoordinatorRelationship.findUnique({
    where: {
      participantId_coordinatorId: { participantId, coordinatorId },
    },
  });
  return rel?.status === "active";
}
