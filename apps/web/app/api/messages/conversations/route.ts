import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { listConversationsForUser } from "@/lib/messages/message-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const conversations = await listConversationsForUser(
    user.id,
    isAdminRole(user.primaryRole)
  );
  return jsonOk({ conversations });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();
  const { type, title, participantIds, bookingId, organisationId } = body;
  if (!type || !title) return jsonError("type and title required");

  const ids: string[] = [...new Set([user.id, ...(participantIds ?? [])])];
  const conversation = await prisma.conversation.create({
    data: {
      type,
      title,
      bookingId,
      organisationId,
      participantId: body.participantId,
      createdById: user.id,
      participants: { create: ids.map((uid) => ({ userId: uid })) },
    },
    include: { participants: true },
  });
  return jsonOk({ conversation }, 201);
}
