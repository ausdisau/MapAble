import { ZodError , z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { updateTicketStatus } from "@/lib/support/ticket-service";

const patchSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  assignedAdminId: z.string().optional().nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { ticketId } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      comments: {
        where: isAdminRole(user.primaryRole)
          ? {}
          : { isInternal: false },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!ticket) return jsonError("Not found", 404);
  if (
    !isAdminRole(user.primaryRole) &&
    ticket.createdById !== user.id &&
    ticket.participantId !== user.id
  ) {
    return jsonError("Forbidden", 403);
  }
  return jsonOk({ ticket });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isAdminRole(user.primaryRole)) return jsonError("Forbidden", 403);

  const { ticketId } = await params;
  try {
    const parsed = patchSchema.parse(await req.json());
    const ticket = await updateTicketStatus(
      ticketId,
      parsed.status ?? "triage",
      user.id,
      { assignedAdminId: parsed.assignedAdminId ?? undefined }
    );
    return jsonOk({ ticket });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Update failed", 500);
  }
}
