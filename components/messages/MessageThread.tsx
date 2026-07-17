"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { MessageBubble } from "@/components/messages/MessageBubble";
import { MessageComposer } from "@/components/messages/MessageComposer";
import { ReadReceipt } from "@/components/messages/ReadReceipt";
import { TypingIndicator } from "@/components/messages/TypingIndicator";
import { useMessageRealtime } from "@/lib/hooks/useMessageRealtime";
import { useTypingIndicator } from "@/lib/hooks/useTypingIndicator";

export function MessageThread({
  conversationId,
  currentUserId,
  messages,
  latestMessageId,
}: {
  conversationId: string;
  currentUserId: string;
  messages: Array<{
    id: string;
    body: string;
    senderUserId: string;
    createdAt: Date;
    readByCurrentUser?: boolean;
  }>;
  latestMessageId: string | null;
}) {
  const router = useRouter();
  const [sending, setSending] = useState(false);

  const refresh = useCallback(() => router.refresh(), [router]);

  useMessageRealtime(conversationId, async () => latestMessageId, refresh);

  const { typingUserIds, signalTyping } = useTypingIndicator(
    conversationId,
    currentUserId
  );

  async function handleSend(body: string) {
    setSending(true);
    try {
      await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      refresh();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex-1 space-y-3 overflow-y-auto p-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((m) => (
          <div key={m.id}>
            <MessageBubble
              body={m.body}
              senderName={m.senderUserId === currentUserId ? "You" : "Participant"}
              isOwn={m.senderUserId === currentUserId}
              createdAt={m.createdAt}
            />
            {m.senderUserId === currentUserId && m.readByCurrentUser !== undefined ? (
              <ReadReceipt read={m.readByCurrentUser} />
            ) : null}
          </div>
        ))}
      </div>
      <TypingIndicator userIds={typingUserIds} />
      <MessageComposer
        disabled={sending}
        onSend={handleSend}
        onTyping={signalTyping}
      />
    </div>
  );
}
