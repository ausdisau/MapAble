import Link from "next/link";
import { notFound } from "next/navigation";

import { ConversationThread } from "@/components/messages/ConversationThread";
import { requireAuth } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { userCanAccessConversation } from "@/lib/messages/message-service";
import { prisma } from "@/lib/prisma";

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const user = await requireAuth();
  const { conversationId } = await params;
  if (!(await userCanAccessConversation(user.id, conversationId, isAdminRole(user.primaryRole)))) notFound();
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { where: { deletedAt: null }, orderBy: { createdAt: "asc" }, include: { sender: { select: { id: true, name: true } } } } },
  });
  if (!conversation) notFound();
  return (
    <div className="space-y-4">
      <Link href="/dashboard/messages" className="text-sm text-primary hover:underline">← Messages</Link>
      <h1 className="font-heading text-2xl font-bold">{conversation.title}</h1>
      <ConversationThread conversationId={conversationId} messages={conversation.messages.map(m => ({ ...m, createdAt: m.createdAt.toISOString() }))} currentUserId={user.id} />
    </div>
  );
}
