import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const where = isAdminRole(user.primaryRole)
    ? {}
    : user.primaryRole === "participant"
      ? { participantId: user.id }
      : { organisationId: { in: [] } };

  if (user.primaryRole === "provider_admin" || user.primaryRole === "support_worker") {
    const memberships = await prisma.organisationMember.findMany({
      where: { userId: user.id },
      select: { organisationId: true },
    });
    Object.assign(where, {
      organisationId: { in: memberships.map((m) => m.organisationId) },
    });
  }

  const timesheets = await prisma.timesheet.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return jsonOk({ timesheets });
}
