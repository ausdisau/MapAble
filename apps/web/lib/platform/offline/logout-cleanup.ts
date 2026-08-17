import {
  OFFLINE_QUEUE_STORAGE_KEY,
  OFFLINE_SHELL_CACHE_KEY,
  createInitialOfflineShellState,
} from "@/lib/platform/offline/offline-contracts";

const OFFLINE_PUSH_TOKEN_KEY = "mapable-push-token-v1";
const OFFLINE_SESSION_HINT_KEY = "mapable-offline-session-v1";

/** Keys cleared on safe logout to prevent cross-user offline leakage. */
export const LOGOUT_CLEANUP_STORAGE_KEYS = [
  OFFLINE_QUEUE_STORAGE_KEY,
  OFFLINE_SHELL_CACHE_KEY,
  OFFLINE_PUSH_TOKEN_KEY,
  OFFLINE_SESSION_HINT_KEY,
] as const;

export interface LogoutCleanupResult {
  clearedKeys: string[];
  skippedKeys: string[];
}

export function performSafeLogoutCleanup(): LogoutCleanupResult {
  const clearedKeys: string[] = [];
  const skippedKeys: string[] = [];

  if (typeof globalThis.localStorage === "undefined") {
    return { clearedKeys, skippedKeys: [...LOGOUT_CLEANUP_STORAGE_KEYS] };
  }

  for (const key of LOGOUT_CLEANUP_STORAGE_KEYS) {
    try {
      globalThis.localStorage.removeItem(key);
      clearedKeys.push(key);
    } catch {
      skippedKeys.push(key);
    }
  }

  return { clearedKeys, skippedKeys };
}

export function resetOfflineShellStateAfterLogout() {
  return createInitialOfflineShellState();
}
