import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { ticketId } = await params;
  const { body, isInternal } = await req.json();
  if (!body?.trim()) return jsonError("Comment required");

  const comment = await prisma.supportTicketComment.create({
    data: {
      ticketId,
      authorId: user.id,
      body: body.trim().slice(0, 5000),
      isInternal: Boolean(isInternal),
    },
  });
  return jsonOk({ comment }, 201);
}
