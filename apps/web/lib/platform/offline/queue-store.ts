import {
  OFFLINE_QUEUE_STORAGE_KEY,
  type OfflineQueuedAction,
  type OfflineActionStatus,
} from "@/lib/platform/offline/offline-contracts";

export interface OfflineQueueStore {
  list(): OfflineQueuedAction[];
  enqueue(action: Omit<OfflineQueuedAction, "createdAt" | "updatedAt">): OfflineQueuedAction;
  updateStatus(id: string, status: OfflineActionStatus, conflictReason?: string): OfflineQueuedAction | null;
  remove(id: string): void;
  clear(): void;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** In-memory queue store — portable to IndexedDB in native clients. */
export function createOfflineQueueStore(
  storageKey = OFFLINE_QUEUE_STORAGE_KEY,
): OfflineQueueStore {
  let queue: OfflineQueuedAction[] = [];

  if (typeof globalThis.localStorage !== "undefined") {
    try {
      const raw = globalThis.localStorage.getItem(storageKey);
      if (raw) queue = JSON.parse(raw) as OfflineQueuedAction[];
    } catch {
      queue = [];
    }
  }

  function persist() {
    if (typeof globalThis.localStorage !== "undefined") {
      globalThis.localStorage.setItem(storageKey, JSON.stringify(queue));
    }
  }

  return {
    list: () => [...queue],
    enqueue(action) {
      const record: OfflineQueuedAction = {
        ...action,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      queue = [...queue, record];
      persist();
      return record;
    },
    updateStatus(id, status, conflictReason) {
      const index = queue.findIndex((item) => item.id === id);
      if (index === -1) return null;
      const updated: OfflineQueuedAction = {
        ...queue[index],
        status,
        conflictReason,
        updatedAt: nowIso(),
      };
      queue = [...queue.slice(0, index), updated, ...queue.slice(index + 1)];
      persist();
      return updated;
    },
    remove(id) {
      queue = queue.filter((item) => item.id !== id);
      persist();
    },
    clear() {
      queue = [];
      persist();
    },
  };
}

export function countPendingActions(store: OfflineQueueStore): number {
  return store.list().filter((item) =>
    ["queued", "syncing", "conflict"].includes(item.status),
  ).length;
}
