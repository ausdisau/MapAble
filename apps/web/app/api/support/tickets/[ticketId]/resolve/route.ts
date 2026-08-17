import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { updateTicketStatus } from "@/lib/support/ticket-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { ticketId } = await params;
  const { resolutionSummary } = await req.json();

  const ticket = await updateTicketStatus(ticketId, "resolved", user.id);
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { resolutionSummary },
  });
  return jsonOk({ ticket });
}
