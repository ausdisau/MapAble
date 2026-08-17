import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export async function userCanAccessConversation(
  userId: string,
  conversationId: string,
  isAdmin: boolean
): Promise<boolean> {
  if (isAdmin) return true;
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return Boolean(participant);
}

export async function listConversationsForUser(userId: string, isAdmin: boolean) {
  if (isAdmin) {
    return prisma.conversation.findMany({
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      include: {
        participants: { include: { user: { select: { id: true, name: true } } } },
      },
    });
  }
  return prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    orderBy: { lastMessageAt: "desc" },
    include: {
      participants: { include: { user: { select: { id: true, name: true } } } },
    },
  });
}

export async function sendMessage(params: {
  conversationId: string;
  senderUserId: string;
  body: string;
  plainLanguageSummary?: string;
  attachmentDocumentIds?: string[];
}) {
  const sanitized = params.body.trim().slice(0, 10000);
  if (!sanitized) throw new Error("EMPTY_MESSAGE");

  const message = await prisma.message.create({
    data: {
      conversationId: params.conversationId,
      senderUserId: params.senderUserId,
      body: sanitized,
      plainLanguageSummary: params.plainLanguageSummary,
      attachmentDocumentIds: params.attachmentDocumentIds ?? [],
    },
  });

  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: { lastMessageAt: new Date() },
  });

  const conv = await prisma.conversation.findUnique({
    where: { id: params.conversationId },
    include: { participants: true },
  });

  if (conv?.bookingId) {
    await recordBookingTimelineEvent({
      bookingId: conv.bookingId,
      eventType: "message_sent",
      title: "New message in booking conversation",
      actorUserId: params.senderUserId,
    });
  }

  for (const p of conv?.participants ?? []) {
    if (p.userId === params.senderUserId) continue;
    await notifyUser(
      p.userId,
      "support",
      "New message",
      "You have a new secure message in MapAble."
    );
  }

  return message;
}

export async function logAdminConversationAccess(params: {
  actorUserId: string;
  actorRole: string;
  conversationId: string;
  participantId?: string;
}) {
  await createAuditEvent({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole as never,
    action: "admin.accessed_sensitive_record",
    entityType: "Conversation",
    entityId: params.conversationId,
    participantId: params.participantId,
    metadata: { context: "participant_provider_messaging" },
  });
}

export async function getUnreadCount(
  userId: string,
  conversationId: string
): Promise<number> {
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      deletedAt: null,
      senderUserId: { not: userId },
    },
    select: { id: true },
  });
  if (!messages.length) return 0;
  const read = await prisma.messageReadReceipt.findMany({
    where: {
      userId,
      messageId: { in: messages.map((m) => m.id) },
    },
  });
  return messages.length - read.length;
}
