import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const q = searchParams.get("q");

  const events = await prisma.auditEvent.findMany({
    where: {
      ...(action ? { action } : {}),
      ...(q
        ? {
            OR: [
              { entityType: { contains: q, mode: "insensitive" } },
              { entityId: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      actorUser: { select: { id: true, name: true, email: true } },
    },
  });

  return jsonOk({ events });
}
