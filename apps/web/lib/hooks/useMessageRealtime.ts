"use client";

import { useEffect, useState } from "react";

import { createPollingSubscription } from "@/lib/realtime/polling-realtime-adapter";
import {
  getRealtimeProvider,
  subscribeToConversation,
  type RealtimeEvent,
  type RealtimeProvider,
} from "@/lib/realtime/supabase-realtime-adapter";

export function useMessageRealtime(
  conversationId: string,
  fetchLatestMessageId: () => Promise<string | null>,
  onRefresh: () => void
) {
  const [connected, setConnected] = useState(false);
  const [provider, setProvider] = useState<RealtimeProvider>("polling");

  useEffect(() => {
    const activeProvider = getRealtimeProvider();
    setProvider(activeProvider);

    const onEvent = (event: RealtimeEvent) => {
      if (event.type === "message:new") onRefresh();
    };

    const unsubSocketOrCloud = subscribeToConversation(
      conversationId,
      onEvent,
    );

    // Always keep polling as a safety net until Socket.IO client is fully wired.
    const unsubPolling = createPollingSubscription(
      conversationId,
      async () => {
        const id = await fetchLatestMessageId();
        return id ? { messageId: id } : null;
      },
      onEvent,
    );

    setConnected(true);
    return () => {
      unsubSocketOrCloud();
      unsubPolling();
      setConnected(false);
    };
  }, [conversationId, fetchLatestMessageId, onRefresh]);

  return { connected, provider };
}
