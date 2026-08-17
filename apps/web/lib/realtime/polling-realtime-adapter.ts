import type { RealtimeEvent } from "@/lib/realtime/types";

export function createPollingSubscription(
  conversationId: string,
  fetchLatest: () => Promise<{ messageId: string } | null>,
  onEvent: (event: RealtimeEvent) => void,
  intervalMs = 5000
): () => void {
  let lastId: string | null = null;
  const timer = setInterval(async () => {
    try {
      const latest = await fetchLatest();
      if (latest && latest.messageId !== lastId) {
        lastId = latest.messageId;
        onEvent({
          type: "message:new",
          conversationId,
          messageId: latest.messageId,
        });
      }
    } catch {
      // ignore polling errors
    }
  }, intervalMs);

  return () => clearInterval(timer);
}
