"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useTypingIndicator(conversationId: string, currentUserId: string) {
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const signalTyping = useCallback(() => {
    void fetch(`/api/messages/conversations/${conversationId}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    }).catch(() => undefined);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      void fetch(`/api/messages/conversations/${conversationId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      }).catch(() => undefined);
    }, 3000);
  }, [conversationId]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/messages/conversations/${conversationId}/typing`
        );
        const data = await res.json();
        const ids = (data.typingUserIds as string[]) ?? [];
        setTypingUserIds(ids.filter((id) => id !== currentUserId));
      } catch {
        setTypingUserIds([]);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [conversationId, currentUserId]);

  return { typingUserIds, signalTyping };
}
