import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { getUserOrganisationIds, participantCareWhere } from "@/lib/api/organisation-scope";
import { jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let where: Record<string, unknown> = {};
  if (isAdminRole(user.primaryRole)) {
    where = {};
  } else if (user.primaryRole === "provider_admin") {
    const orgIds = await getUserOrganisationIds(user.id);
    where = { organisationId: { in: orgIds } };
  } else {
    const pw = participantCareWhere(user);
    where = "participantId" in pw ? { participantId: pw.participantId } : {};
  }

  const bookings = await prisma.careBooking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      organisation: { select: { id: true, name: true } },
      careRequest: { select: { id: true, title: true, status: true } },
    },
  });

  return jsonOk({ bookings });
}

export async function POST() {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  return jsonOk({ message: "Create bookings via care request accept flow" }, 405);
}
