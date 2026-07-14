import type { OfflineQueuedAction } from "@/lib/platform/offline/offline-contracts";

export type SyncConflictResolution = "keep_local" | "keep_remote" | "merge" | "defer";

export interface SyncConflict {
  actionId: string;
  localVersion: OfflineQueuedAction;
  remoteVersion: Record<string, unknown>;
  reason: string;
}

export interface SyncResult {
  synced: string[];
  conflicts: SyncConflict[];
  failed: Array<{ actionId: string; error: string }>;
}

export interface SyncAdapter {
  push(action: OfflineQueuedAction): Promise<{ ok: true } | { ok: false; conflict: SyncConflict }>;
}

export function resolveConflict(
  conflict: SyncConflict,
  resolution: SyncConflictResolution,
): OfflineQueuedAction | null {
  switch (resolution) {
    case "keep_local":
      return { ...conflict.localVersion, status: "queued", conflictReason: undefined };
    case "keep_remote":
      return null;
    case "merge":
      return {
        ...conflict.localVersion,
        payload: {
          ...conflict.localVersion.payload,
          ...conflict.remoteVersion,
        },
        status: "queued",
        conflictReason: undefined,
      };
    case "defer":
      return {
        ...conflict.localVersion,
        status: "conflict",
        conflictReason: conflict.reason,
      };
    default: {
      const exhaustive: never = resolution;
      return exhaustive;
    }
  }
}

export async function syncQueuedActions(
  actions: OfflineQueuedAction[],
  adapter: SyncAdapter,
): Promise<SyncResult> {
  const result: SyncResult = { synced: [], conflicts: [], failed: [] };

  for (const action of actions) {
    if (action.status !== "queued") continue;
    try {
      const outcome = await adapter.push(action);
      if (outcome.ok) {
        result.synced.push(action.id);
      } else {
        result.conflicts.push(outcome.conflict);
      }
    } catch (error) {
      result.failed.push({
        actionId: action.id,
        error: error instanceof Error ? error.message : "SYNC_FAILED",
      });
    }
  }

  return result;
}
