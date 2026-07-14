import { describe, expect, it } from "vitest";

import {
  OFFLINE_EXCLUDED_PATH_PREFIXES,
  OFFLINE_SHELL_PATHS,
  shouldExcludeFromOfflineCache,
} from "@/lib/platform/offline/offline-contracts";
import { performSafeLogoutCleanup } from "@/lib/platform/offline/logout-cleanup";
import { createOfflineQueueStore, countPendingActions } from "@/lib/platform/offline/queue-store";
import { computeDegradedModeIndicator } from "@/lib/platform/offline/degraded-mode";
import { createInitialOfflineShellState } from "@/lib/platform/offline/offline-contracts";

describe("offline shell contracts", () => {
  it("defines shell paths without participant API routes", () => {
    for (const path of OFFLINE_SHELL_PATHS) {
      expect(path).not.toMatch(/^\/api\/participant/);
    }
  });

  it("excludes participant record paths from offline cache", () => {
    expect(shouldExcludeFromOfflineCache("/api/participant/communication")).toBe(true);
    expect(shouldExcludeFromOfflineCache("/api/v1/participants/abc")).toBe(true);
    expect(shouldExcludeFromOfflineCache("/offline")).toBe(false);
  });

  it("lists excluded prefixes for service worker", () => {
    expect(OFFLINE_EXCLUDED_PATH_PREFIXES).toContain("/api/participant/");
  });
});

describe("offline queue store", () => {
  it("enqueues and counts pending actions", () => {
    const store = createOfflineQueueStore("test-offline-queue-" + Date.now());
    store.clear();
    store.enqueue({
      id: "action-1",
      type: "draft_message",
      payload: { text: "hello" },
      status: "queued",
      idempotencyKey: "key-1",
    });
    expect(countPendingActions(store)).toBe(1);
    store.clear();
  });
});

describe("offline degraded mode", () => {
  it("announces offline state assertively", () => {
    const indicator = computeDegradedModeIndicator({
      shell: { ...createInitialOfflineShellState(), isOnline: false },
      pendingSyncCount: 0,
      conflictCount: 0,
      pushAvailable: true,
    });
    expect(indicator.active).toBe(true);
    expect(indicator.ariaLive).toBe("assertive");
    expect(indicator.message).toMatch(/offline/i);
  });
});

describe("safe logout cleanup", () => {
  it("returns cleanup result structure", () => {
    const result = performSafeLogoutCleanup();
    expect(result).toHaveProperty("clearedKeys");
    expect(result).toHaveProperty("skippedKeys");
  });
});
