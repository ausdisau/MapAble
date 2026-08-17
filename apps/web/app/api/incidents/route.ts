import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { createIncident } from "@/lib/incidents/incident-service";
import { prisma } from "@/lib/prisma";
import { incidentListWhereForUser } from "@/lib/safety/incident-access";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const where = incidentListWhereForUser(
    user.id,
    isAdminRole(user.primaryRole)
  );
  const incidents = await prisma.incidentReport.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return jsonOk({ incidents });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("incident:create");
  if (user instanceof Response) return user;
  const body = await req.json();
  const participantId =
    body.participantId ??
    (user.primaryRole === "participant" ? user.id : undefined);
  const incident = await createIncident({
    ...body,
    reportedById: user.id,
    participantId,
    occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
  });
  return jsonOk({ incident }, 201);
}
