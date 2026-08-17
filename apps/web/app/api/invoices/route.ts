import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const memberships = await prisma.organisationMember.findMany({
    where: { userId: user.id },
    select: { organisationId: true },
  });
  const orgIds = memberships.map((m) => m.organisationId);

  const where = isAdminRole(user.primaryRole)
    ? {}
    : {
        OR: [
          { participantId: user.id },
          ...(orgIds.length
            ? [{ organisationId: { in: orgIds } }]
            : []),
        ],
      };

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { lines: true },
    take: 100,
  });
  return jsonOk({ invoices });
}
