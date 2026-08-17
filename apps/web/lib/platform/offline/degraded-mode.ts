import type { OfflineShellState } from "@/lib/platform/offline/offline-contracts";

export type DegradedModeReason =
  | "offline"
  | "sync_backlog"
  | "sync_conflict"
  | "push_unavailable";

export interface DegradedModeIndicator {
  active: boolean;
  reasons: DegradedModeReason[];
  message: string;
  ariaLive: "polite" | "assertive";
}

export function computeDegradedModeIndicator(input: {
  shell: OfflineShellState;
  pendingSyncCount: number;
  conflictCount: number;
  pushAvailable: boolean;
}): DegradedModeIndicator {
  const reasons: DegradedModeReason[] = [];

  if (!input.shell.isOnline) reasons.push("offline");
  if (input.pendingSyncCount > 0) reasons.push("sync_backlog");
  if (input.conflictCount > 0) reasons.push("sync_conflict");
  if (!input.pushAvailable) reasons.push("push_unavailable");

  const active = reasons.length > 0;

  let message = "All systems available.";
  if (reasons.includes("offline")) {
    message =
      "You are offline. Draft actions are saved locally and will sync when you reconnect.";
  } else if (reasons.includes("sync_conflict")) {
    message =
      "Some offline changes need your review before they can sync.";
  } else if (reasons.includes("sync_backlog")) {
    message = "Syncing your saved changes…";
  } else if (reasons.includes("push_unavailable")) {
    message = "Push notifications are unavailable in this environment.";
  }

  return {
    active,
    reasons,
    message,
    ariaLive: reasons.includes("offline") ? "assertive" : "polite",
  };
}
