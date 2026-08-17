import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { assertProviderOrgAccess } from "@/lib/care/access-control";
import { escalateToQualitySafeguards } from "@/lib/incidents/incident-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;

  const incident = await prisma.incidentReport.findUnique({ where: { id } });
  if (!incident) return jsonError("Not found", 404);

  if (!isAdminRole(user.primaryRole)) {
    if (user.primaryRole === "provider_admin" && incident.organisationId) {
      try {
        await assertProviderOrgAccess(user, incident.organisationId);
      } catch {
        return jsonError("Forbidden", 403);
      }
    } else if (user.primaryRole !== "support_worker") {
      return jsonError("Forbidden", 403);
    }
  }

  const updated = await escalateToQualitySafeguards(id, user.id);
  return jsonOk({ incident: updated });
}
