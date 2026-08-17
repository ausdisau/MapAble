"use client";

import { MessageBubble } from "@/components/messages/MessageBubble";
import { MessageComposer } from "@/components/messages/MessageComposer";

export function ConversationThread({
  conversationId,
  messages,
  currentUserId,
}: {
  conversationId: string;
  messages: {
    id: string;
    body: string;
    createdAt: string;
    sender: { id: string; name: string };
  }[];
  currentUserId: string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-3" role="log" aria-label="Message thread">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            body={m.body}
            senderName={m.sender.name}
            createdAt={m.createdAt}
            isOwn={m.sender.id === currentUserId}
          />
        ))}
      </div>
      <MessageComposer
        onSend={async (body) => {
          const res = await fetch(
            `/api/messages/conversations/${conversationId}/messages`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ body }),
            }
          );
          if (!res.ok) throw new Error("send failed");
          window.location.reload();
        }}
      />
    </div>
  );
}
