import { createQueueProvider } from "@/lib/platform/cloud-providers";
import { publishPendingCloudEvents } from "@/lib/platform/event-outbox-service";

export type OutboxRelayStatus = {
  running: boolean;
  intervalMs: number | null;
  lastRunAt: string | null;
  lastProcessed: number | null;
  lastError: string | null;
};

const DEFAULT_INTERVAL_MS = 30_000;

let intervalHandle: ReturnType<typeof setInterval> | null = null;
let running = false;
let intervalMs: number | null = null;
let lastRunAt: Date | null = null;
let lastProcessed: number | null = null;
let lastError: string | null = null;
let relayInFlight = false;

export function getOutboxRelayStatus(): OutboxRelayStatus {
  return {
    running,
    intervalMs,
    lastRunAt: lastRunAt?.toISOString() ?? null,
    lastProcessed,
    lastError,
  };
}

export async function runOutboxRelayOnce(options?: { limit?: number }) {
  if (relayInFlight) {
    return { processed: 0, skipped: true as const };
  }
  relayInFlight = true;
  try {
    const queue = createQueueProvider();
    const result = await publishPendingCloudEvents(queue, {
      limit: options?.limit,
    });
    lastRunAt = new Date();
    lastProcessed = result.processed;
    lastError = null;
    return { ...result, skipped: false as const };
  } catch (error) {
    lastRunAt = new Date();
    lastError =
      error instanceof Error ? error.message.slice(0, 500) : "RELAY_FAILED";
    throw error;
  } finally {
    relayInFlight = false;
  }
}

export function startOutboxRelayWorker(options?: { intervalMs?: number }) {
  if (running) return getOutboxRelayStatus();

  const ms = options?.intervalMs ?? DEFAULT_INTERVAL_MS;
  intervalMs = ms;
  running = true;

  intervalHandle = setInterval(() => {
    void runOutboxRelayOnce().catch(() => {
      /* status updated in runOutboxRelayOnce */
    });
  }, ms);

  if (typeof intervalHandle === "object" && "unref" in intervalHandle) {
    intervalHandle.unref();
  }

  return getOutboxRelayStatus();
}

export function stopOutboxRelayWorker() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  running = false;
  intervalMs = null;
  return getOutboxRelayStatus();
}
