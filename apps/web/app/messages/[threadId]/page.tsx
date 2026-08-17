import { notFound } from "next/navigation";

import { ChatInfoPanel } from "@/components/messages/ChatInfoPanel";
import { CommunicationCentreShell } from "@/components/messages/CommunicationCentreShell";
import { InboxPanel } from "@/components/messages/InboxPanel";
import { MessageThread } from "@/components/messages/MessageThread";
import { requireAuth } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { canAccessMessageThread } from "@/lib/messages/message-access-policy";
import {
  listConversationsForUser,
} from "@/lib/messages/message-service";
import { prisma } from "@/lib/prisma";

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const user = await requireAuth();
  const { threadId } = await params;
  const isAdmin = isAdminRole(user.primaryRole);

  const allowed = await canAccessMessageThread(user.id, threadId, { isAdmin });
  if (!allowed) notFound();

  const [conversations, conversation, messages] = await Promise.all([
    listConversationsForUser(user.id, isAdmin),
    prisma.conversation.findUnique({
      where: { id: threadId },
      include: { participants: true },
    }),
    prisma.message.findMany({
      where: { conversationId: threadId },
      orderBy: { createdAt: "asc" },
      take: 200,
    }),
  ]);

  if (!conversation) notFound();

  const latest = messages[messages.length - 1];

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Communication Centre</h1>
      <CommunicationCentreShell
        sidebar={
          <InboxPanel
            conversations={conversations.map((c) => ({
              id: c.id,
              title: c.title,
              lastMessageAt: c.lastMessageAt,
            }))}
            activeId={threadId}
          />
        }
        main={
          <MessageThread
            conversationId={threadId}
            currentUserId={user.id}
            latestMessageId={latest?.id ?? null}
            messages={messages.map((m) => ({
              id: m.id,
              body: m.body,
              senderUserId: m.senderUserId,
              createdAt: m.createdAt,
            }))}
          />
        }
        info={
          <ChatInfoPanel
            title={conversation.title}
            type={conversation.type}
            participantCount={conversation.participants.length}
          />
        }
      />
    </div>
  );
}
