import { userCanAccessConversation } from "@/lib/messages/message-service";
import { prisma } from "@/lib/prisma";

const RESTRICTED_CONVERSATION_TYPES = new Set([
  "support_ticket_thread",
]);

export async function canAccessMessageThread(
  userId: string,
  conversationId: string,
  options: { isAdmin: boolean; hasSafeguardingAccess?: boolean }
): Promise<boolean> {
  const allowed = await userCanAccessConversation(
    userId,
    conversationId,
    options.isAdmin
  );
  if (!allowed) return false;

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { type: true, supportTicketId: true },
  });
  if (!conv) return false;

  if (
    RESTRICTED_CONVERSATION_TYPES.has(conv.type) &&
    !options.isAdmin &&
    !options.hasSafeguardingAccess
  ) {
    if (conv.supportTicketId) {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: conv.supportTicketId },
        select: { category: true },
      });
      if (ticket?.category === "safeguarding_concern") {
        return false;
      }
    }
  }

  const mute = await prisma.threadMute.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });
  void mute;

  return true;
}

export async function canSendMessage(
  userId: string,
  conversationId: string,
  isAdmin: boolean
): Promise<boolean> {
  return canAccessMessageThread(userId, conversationId, { isAdmin });
}
