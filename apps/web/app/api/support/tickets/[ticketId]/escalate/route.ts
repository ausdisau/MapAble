import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { updateTicketStatus } from "@/lib/support/ticket-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { ticketId } = await params;
  const { reason } = await req.json();

  const ticket = await updateTicketStatus(ticketId, "escalated", user.id);
  await import("@/lib/prisma").then(({ prisma }) =>
    prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        escalationReason: reason,
        requiresIncidentReview: true,
      },
    })
  );
  return jsonOk({ ticket });
}
