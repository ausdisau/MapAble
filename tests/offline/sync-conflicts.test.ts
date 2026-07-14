import { describe, expect, it } from "vitest";

import { resolveConflict } from "@/lib/platform/sync/sync-service";
import type { SyncConflict } from "@/lib/platform/sync/sync-service";

describe("sync conflict handling", () => {
  const baseConflict: SyncConflict = {
    actionId: "a1",
    localVersion: {
      id: "a1",
      type: "draft_message",
      payload: { text: "local" },
      status: "queued",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      idempotencyKey: "k1",
    },
    remoteVersion: { text: "remote" },
    reason: "VERSION_MISMATCH",
  };

  it("defers on defer resolution", () => {
    const result = resolveConflict(baseConflict, "defer");
    expect(result?.status).toBe("conflict");
    expect(result?.conflictReason).toBe("VERSION_MISMATCH");
  });

  it("clears local on keep_remote", () => {
    expect(resolveConflict(baseConflict, "keep_remote")).toBeNull();
  });

  it("merges payloads on merge resolution", () => {
    const result = resolveConflict(baseConflict, "merge");
    expect(result?.payload).toEqual({ text: "remote" });
    expect(result?.status).toBe("queued");
  });
});
