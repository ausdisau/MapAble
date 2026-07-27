export type OfflineActionType =
  | "draft_incident"
  | "draft_timesheet_note"
  | "draft_message"
  | "voice_intent_draft";

export type OfflineActionStatus =
  | "queued"
  | "syncing"
  | "conflict"
  | "failed"
  | "completed";

export interface OfflineQueuedAction {
  id: string;
  type: OfflineActionType;
  payload: Record<string, unknown>;
  status: OfflineActionStatus;
  createdAt: string;
  updatedAt: string;
  /** Client-generated idempotency key for safe replay */
  idempotencyKey: string;
  conflictReason?: string;
}

export interface OfflineShellState {
  isOnline: boolean;
  degradedMode: boolean;
  queuedCount: number;
  lastSyncedAt: string | null;
  /** Shell assets cached — not participant records */
  shellCached: boolean;
}

export const OFFLINE_SHELL_CACHE_KEY = "mapable-offline-shell-v1";
export const OFFLINE_QUEUE_STORAGE_KEY = "mapable-offline-queue-v1";

/** Routes and static assets safe to cache in the service worker shell. */
export const OFFLINE_SHELL_PATHS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
] as const;

/** Explicitly excluded from offline cache — participant records stay online-only. */
export const OFFLINE_EXCLUDED_PATH_PREFIXES = [
  "/api/participant/",
  "/api/v1/participants",
  "/api/intelligence/",
] as const;

export function createInitialOfflineShellState(): OfflineShellState {
  return {
    isOnline: true,
    degradedMode: false,
    queuedCount: 0,
    lastSyncedAt: null,
    shellCached: false,
  };
}

export function shouldExcludeFromOfflineCache(pathname: string): boolean {
  return OFFLINE_EXCLUDED_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
}
