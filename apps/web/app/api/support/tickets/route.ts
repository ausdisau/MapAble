import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { createSupportTicket } from "@/lib/support/ticket-service";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where = isAdminRole(user.primaryRole)
    ? { ...(status ? { status: status as never } : {}) }
    : {
        OR: [
          { createdById: user.id },
          { participantId: user.id },
        ],
        ...(status ? { status: status as never } : {}),
      };

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return jsonOk({ tickets });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, "support:create")) {
    return jsonError("Forbidden", 403);
  }

  const body = await req.json();
  const ticket = await createSupportTicket({
    title: body.title,
    description: body.description,
    category: body.category,
    priority: body.priority,
    participantId: body.participantId ?? user.id,
    organisationId: body.organisationId,
    bookingId: body.bookingId,
    createdById: user.id,
  });
  return jsonOk({ ticket }, 201);
}
