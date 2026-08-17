import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const where = isAdminRole(user.primaryRole)
    ? {}
    : { participantId: user.id };
  const attestations = await prisma.attestation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      status: true,
      claim: true,
      entityType: true,
      entityId: true,
      createdAt: true,
      participantId: true,
    },
  });
  return jsonOk({ attestations });
}
