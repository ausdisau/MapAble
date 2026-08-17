import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export function canUserAccessTicket(
  ticket: { createdById: string; participantId: string | null },
  userId: string,
  isAdmin: boolean
) {
  if (isAdmin) return true;
  return ticket.createdById === userId || ticket.participantId === userId;
}

export async function getSupportTicketForUser(
  ticketId: string,
  userId: string,
  role: string
) {
  const isAdmin = isAdminRole(role as never);
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      comments: {
        where: isAdmin ? {} : { isInternal: false },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!ticket) return null;
  if (!canUserAccessTicket(ticket, userId, isAdmin)) return null;
  return ticket;
}
