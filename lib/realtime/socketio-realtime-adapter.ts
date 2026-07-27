/**
 * Socket.IO messaging client adapter (Replit socket-client / socket-server port).
 * Prefer apps/realtime-server (Socket.IO). Do not run the Replit raw `ws` echo server.
 *
 * Client library wiring lands when `socket.io-client` is a first-party dependency.
 * Until then this adapter is intentionally a documented no-op so callers can fall
 * back to polling without a parallel messaging stack.
 */

import type { RealtimeEvent } from "@/lib/realtime/types";

export function isSocketIoRealtimeConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const enabled =
    env.NEXT_PUBLIC_SOCKETIO_ENABLED === "true" ||
    env.SOCKETIO_ENABLED === "true";
  const url = (
    env.NEXT_PUBLIC_SOCKETIO_SERVER_URL ||
    env.SOCKETIO_SERVER_URL ||
    ""
  ).trim();
  return enabled && Boolean(url);
}

/**
 * Subscribe to conversation events via Socket.IO when configured.
 * Currently returns a no-op unsubscribe; use polling until the client SDK is wired.
 */
export function createSocketIoSubscription(
  _conversationId: string,
  _onEvent: (event: RealtimeEvent) => void,
): () => void {
  void _conversationId;
  void _onEvent;
  if (!isSocketIoRealtimeConfigured()) {
    return () => undefined;
  }
  // Placeholder for Socket.IO client join on `thread:{conversationId}`.
  return () => undefined;
}
