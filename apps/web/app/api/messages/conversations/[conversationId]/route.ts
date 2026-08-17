import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import {
  getUnreadCount,
  logAdminConversationAccess,
  userCanAccessConversation,
} from "@/lib/messages/message-service";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { conversationId } = await params;
  const isAdmin = isAdminRole(user.primaryRole);

  if (!(await userCanAccessConversation(user.id, conversationId, isAdmin))) {
    return jsonError("Forbidden", 403);
  }

  if (isAdmin) {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    await logAdminConversationAccess({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      conversationId,
      participantId: conv?.participantId ?? undefined,
    });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true } } },
      },
      participants: { include: { user: { select: { id: true, name: true } } } },
    },
  });
  if (!conversation) return jsonError("Not found", 404);

  const unreadCount = await getUnreadCount(user.id, conversationId);
  return jsonOk({ conversation, unreadCount });
}
