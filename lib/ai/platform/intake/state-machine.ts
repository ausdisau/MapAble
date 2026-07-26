import type { IntakeDocumentStatus } from "./types";

const TRANSITIONS: Record<IntakeDocumentStatus, IntakeDocumentStatus[]> = {
  uploaded: ["validated", "rejected", "expired"],
  validated: ["scan_pending", "rejected", "expired"],
  scan_pending: ["extracting", "scan_failed", "rejected", "expired"],
  scan_failed: ["rejected", "scan_pending", "expired"],
  extracting: ["candidates_ready", "rejected", "expired"],
  candidates_ready: ["in_review", "rejected", "expired"],
  in_review: ["corrected", "approved_pending_write", "rejected", "expired"],
  corrected: ["in_review", "approved_pending_write", "rejected", "expired"],
  approved_pending_write: ["write_refused", "rejected", "expired"],
  write_refused: ["approved_pending_write", "rejected", "expired"],
  rejected: [],
  expired: [],
};

export function canTransitionIntakeStatus(
  from: IntakeDocumentStatus,
  to: IntakeDocumentStatus
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertIntakeTransition(
  from: IntakeDocumentStatus,
  to: IntakeDocumentStatus
): void {
  if (!canTransitionIntakeStatus(from, to)) {
    throw new Error(`Invalid intake status transition: ${from} → ${to}`);
  }
}

/** Terminal statuses that must not proceed to canonical write. */
export function isIntakeTerminal(status: IntakeDocumentStatus): boolean {
  return status === "rejected" || status === "expired" || status === "write_refused";
}
