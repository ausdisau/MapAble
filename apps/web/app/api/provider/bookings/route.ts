import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const memberships = await prisma.organisationMember.findMany({
    where: { userId: user.id },
    select: { organisationId: true },
  });
  const orgIds = memberships.map((m) => m.organisationId);

  const bookings = await prisma.booking.findMany({
    where: { assignedOrganisationId: { in: orgIds } },
    orderBy: { createdAt: "desc" },
    include: { participant: { select: { name: true } } },
  });

  return jsonOk({ bookings });
}
