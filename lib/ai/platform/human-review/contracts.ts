export const HUMAN_REVIEW_STATES = [
  "suggestion_generated",
  "participant_correction_requested",
  "human_review_required",
  "approved",
  "rejected",
  "amended",
  "expired",
  "withdrawn",
  "superseded",
] as const;

export type HumanReviewState = (typeof HUMAN_REVIEW_STATES)[number];

export type ProposalApprovalBinding = {
  proposalHash: string;
  actorId: string;
  actorAuthority: string;
  purpose: string;
  timestamp: string;
  expiresAt: string | null;
  dataDisclosed: string[];
  proposedAction: string;
  revision: number;
};

/** A model-generated proposal is never approved merely because it exists. */
export function isProposalApproved(state: HumanReviewState): boolean {
  return state === "approved";
}

export function assertApprovalBindingComplete(
  binding: ProposalApprovalBinding
): boolean {
  return Boolean(
    binding.proposalHash &&
      binding.actorId &&
      binding.actorAuthority &&
      binding.purpose &&
      binding.timestamp &&
      binding.proposedAction &&
      binding.revision >= 1
  );
}
