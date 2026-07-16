import type { PublicationStatus } from "@/lib/indoor-accessibility/schemas/core";

const VALID_TRANSITIONS: Record<PublicationStatus, PublicationStatus[]> = {
  draft: ["in_review", "archived"],
  in_review: ["changes_requested", "approved", "rejected", "draft"],
  changes_requested: ["draft", "in_review"],
  approved: ["published", "draft"],
  published: ["superseded", "archived"],
  superseded: ["archived"],
  archived: [],
  rejected: ["draft"],
};

export function canTransitionPublication(
  from: PublicationStatus,
  to: PublicationStatus,
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertPublicationTransition(
  from: PublicationStatus,
  to: PublicationStatus,
): void {
  if (!canTransitionPublication(from, to)) {
    throw new Error(`Invalid publication transition: ${from} → ${to}`);
  }
}

/** Published versions are immutable — edits require a new draft version. */
export function requiresNewVersionForEdit(status: PublicationStatus): boolean {
  return status === "published" || status === "superseded";
}
