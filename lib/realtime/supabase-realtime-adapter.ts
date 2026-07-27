import { createSocketIoSubscription } from "@/lib/realtime/socketio-realtime-adapter";
import type { RealtimeEvent, RealtimeProvider } from "@/lib/realtime/types";

export type { RealtimeEvent, RealtimeProvider };

export function getRealtimeProvider(): RealtimeProvider {
  const v = process.env.REALTIME_PROVIDER ?? "polling";
  if (v === "supabase" || v === "socketio") return v;
  return "polling";
}

/** MVP: polling by default; Socket.IO path when REALTIME_PROVIDER=socketio. */
export function subscribeToConversation(
  conversationId: string,
  onEvent: (event: RealtimeEvent) => void
): () => void {
  const provider = getRealtimeProvider();
  if (provider === "socketio") {
    return createSocketIoSubscription(conversationId, onEvent);
  }
  void conversationId;
  void onEvent;
  return () => undefined;
}
