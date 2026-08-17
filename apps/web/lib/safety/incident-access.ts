import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export function incidentListWhereForUser(userId: string, isAdmin: boolean) {
  if (isAdmin) return {};
  return {
    OR: [{ participantId: userId }, { reportedById: userId }],
  };
}

export function canUserAccessIncident(
  incident: { participantId: string | null; reportedById: string },
  userId: string,
  isAdmin: boolean
) {
  if (isAdmin) return true;
  return (
    incident.participantId === userId || incident.reportedById === userId
  );
}

export async function getIncidentForUser(incidentId: string, userId: string, role: string) {
  const isAdmin = isAdminRole(role as never);
  const incident = await prisma.incidentReport.findUnique({
    where: { id: incidentId },
    include: {
      updates: { orderBy: { createdAt: "asc" } },
      reportedBy: { select: { name: true } },
    },
  });
  if (!incident) return null;
  if (!canUserAccessIncident(incident, userId, isAdmin)) return null;
  return incident;
}
