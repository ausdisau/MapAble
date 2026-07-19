import type { BillingInvoiceState, BillingPermission } from "@/types/billing";

export type TransitionContext = {
  permission: BillingPermission | BillingPermission[];
  reasonRequired?: boolean;
};

type TransitionEdge = {
  to: BillingInvoiceState;
  permissions: BillingPermission[];
  reasonRequired?: boolean;
};

/**
 * Explicit invoice lifecycle. Legacy statuses remain readable and
 * map into the modern graph where listed.
 */
const TRANSITIONS: Partial<
  Record<BillingInvoiceState, TransitionEdge[]>
> = {
  draft: [
    { to: "evidence_required", permissions: ["billing:edit_draft"] },
    { to: "policy_review_required", permissions: ["billing:edit_draft"] },
    { to: "participant_review", permissions: ["billing:edit_draft"] },
    { to: "provider_review", permissions: ["billing:edit_draft"] },
    { to: "void", permissions: ["billing:void_invoice"], reasonRequired: true },
    { to: "cancelled", permissions: ["billing:void_invoice"], reasonRequired: true },
  ],
  evidence_required: [
    { to: "draft", permissions: ["billing:edit_draft"] },
    { to: "policy_review_required", permissions: ["billing:edit_draft"] },
    { to: "void", permissions: ["billing:void_invoice"], reasonRequired: true },
  ],
  policy_review_required: [
    { to: "draft", permissions: ["billing:manage_policy", "billing:edit_draft"] },
    {
      to: "participant_review",
      permissions: ["billing:manage_policy", "billing:edit_draft"],
    },
    { to: "void", permissions: ["billing:void_invoice"], reasonRequired: true },
  ],
  participant_review: [
    {
      to: "provider_review",
      permissions: ["billing:approve_participant"],
    },
    { to: "approved", permissions: ["billing:approve_participant"] },
    { to: "disputed", permissions: ["billing:view_own"], reasonRequired: true },
    { to: "draft", permissions: ["billing:edit_draft"], reasonRequired: true },
  ],
  provider_review: [
    { to: "approved", permissions: ["billing:approve_provider"] },
    { to: "draft", permissions: ["billing:edit_draft"], reasonRequired: true },
    {
      to: "participant_review",
      permissions: ["billing:edit_draft"],
      reasonRequired: true,
    },
  ],
  approved: [
    { to: "ready_to_issue", permissions: ["billing:issue_invoice"] },
    { to: "on_hold", permissions: ["billing:edit_draft"], reasonRequired: true },
  ],
  ready_to_issue: [
    { to: "issued", permissions: ["billing:issue_invoice"] },
    { to: "on_hold", permissions: ["billing:edit_draft"], reasonRequired: true },
  ],
  issued: [
    { to: "sent", permissions: ["billing:issue_invoice"] },
    { to: "pending_payment", permissions: ["billing:issue_invoice"] },
    { to: "exported", permissions: ["billing:export"] },
    { to: "disputed", permissions: ["billing:view_own"], reasonRequired: true },
    { to: "on_hold", permissions: ["billing:edit_draft"], reasonRequired: true },
    { to: "void", permissions: ["billing:void_invoice"], reasonRequired: true },
  ],
  sent: [
    { to: "partially_paid", permissions: ["billing:record_payment"] },
    { to: "paid", permissions: ["billing:record_payment"] },
    { to: "overdue", permissions: ["billing:record_payment", "billing:view_all"] },
    { to: "disputed", permissions: ["billing:view_own"], reasonRequired: true },
    { to: "on_hold", permissions: ["billing:edit_draft"], reasonRequired: true },
    { to: "exported", permissions: ["billing:export"] },
  ],
  pending_payment: [
    { to: "partially_paid", permissions: ["billing:record_payment"] },
    { to: "paid", permissions: ["billing:record_payment"] },
    { to: "failed", permissions: ["billing:record_payment"] },
    { to: "overdue", permissions: ["billing:record_payment"] },
    { to: "disputed", permissions: ["billing:view_own"], reasonRequired: true },
  ],
  partially_paid: [
    { to: "paid", permissions: ["billing:record_payment"] },
    { to: "overdue", permissions: ["billing:record_payment"] },
    { to: "credited", permissions: ["billing:create_credit_note"] },
    { to: "disputed", permissions: ["billing:view_own"], reasonRequired: true },
  ],
  paid: [
    { to: "credited", permissions: ["billing:create_credit_note"] },
    { to: "refunded", permissions: ["billing:record_payment"] },
    { to: "disputed", permissions: ["billing:view_own"], reasonRequired: true },
  ],
  overdue: [
    { to: "partially_paid", permissions: ["billing:record_payment"] },
    { to: "paid", permissions: ["billing:record_payment"] },
    { to: "disputed", permissions: ["billing:view_own"], reasonRequired: true },
    { to: "written_off", permissions: ["billing:void_invoice"], reasonRequired: true },
    { to: "on_hold", permissions: ["billing:edit_draft"], reasonRequired: true },
  ],
  disputed: [
    { to: "on_hold", permissions: ["billing:edit_draft"] },
    { to: "credited", permissions: ["billing:create_credit_note"] },
    { to: "sent", permissions: ["billing:approve_provider"], reasonRequired: true },
    { to: "paid", permissions: ["billing:record_payment"] },
  ],
  on_hold: [
    { to: "draft", permissions: ["billing:edit_draft"], reasonRequired: true },
    { to: "sent", permissions: ["billing:issue_invoice"], reasonRequired: true },
    { to: "ready_to_issue", permissions: ["billing:issue_invoice"] },
    { to: "void", permissions: ["billing:void_invoice"], reasonRequired: true },
  ],
  credited: [
    { to: "void", permissions: ["billing:void_invoice"], reasonRequired: true },
  ],
  failed: [
    { to: "pending_payment", permissions: ["billing:record_payment"] },
    { to: "sent", permissions: ["billing:issue_invoice"] },
    { to: "void", permissions: ["billing:void_invoice"], reasonRequired: true },
  ],
  refunded: [],
  void: [],
  written_off: [],
  cancelled: [],
  exported: [
    { to: "sent", permissions: ["billing:export"] },
    { to: "paid", permissions: ["billing:record_payment"] },
    { to: "partially_paid", permissions: ["billing:record_payment"] },
  ],
};

/** Statuses where financial amounts must not be edited in place. */
export const IMMUTABLE_AMOUNT_STATES: ReadonlySet<BillingInvoiceState> = new Set([
  "issued",
  "sent",
  "pending_payment",
  "partially_paid",
  "paid",
  "overdue",
  "disputed",
  "credited",
  "void",
  "written_off",
  "refunded",
  "cancelled",
  "exported",
]);

export function isTransitionAllowed(
  from: BillingInvoiceState,
  to: BillingInvoiceState
): boolean {
  if (from === to) return false;
  const edges = TRANSITIONS[from] ?? [];
  return edges.some((e) => e.to === to);
}

export function getTransitionEdge(
  from: BillingInvoiceState,
  to: BillingInvoiceState
): TransitionEdge | undefined {
  return (TRANSITIONS[from] ?? []).find((e) => e.to === to);
}

export function assertCanTransition(params: {
  from: BillingInvoiceState;
  to: BillingInvoiceState;
  actorPermissions: BillingPermission[];
  reason?: string;
}): TransitionEdge {
  const edge = getTransitionEdge(params.from, params.to);
  if (!edge) {
    throw new Error(
      `Invalid invoice transition: ${params.from} → ${params.to}`
    );
  }
  const allowed = edge.permissions.some((p) =>
    params.actorPermissions.includes(p)
  );
  if (!allowed) {
    throw new Error(
      `Missing permission for transition ${params.from} → ${params.to}`
    );
  }
  if (edge.reasonRequired && !params.reason?.trim()) {
    throw new Error(
      `Reason required for transition ${params.from} → ${params.to}`
    );
  }
  return edge;
}

export function canEditAmounts(status: BillingInvoiceState): boolean {
  return !IMMUTABLE_AMOUNT_STATES.has(status);
}

export function plainLanguageStatus(status: BillingInvoiceState): string {
  const labels: Record<BillingInvoiceState, string> = {
    draft: "Draft — not yet shared",
    evidence_required: "Waiting for service evidence",
    policy_review_required: "Needs pricing policy review",
    participant_review: "Waiting for your review",
    provider_review: "Waiting for provider review",
    approved: "Approved — ready to prepare",
    ready_to_issue: "Ready to issue",
    issued: "Issued",
    sent: "Sent to payer",
    partially_paid: "Partially paid",
    paid: "Paid in full",
    overdue: "Overdue",
    disputed: "Under review (question raised)",
    on_hold: "On hold",
    credited: "Credited",
    void: "Void",
    written_off: "Written off",
    pending_payment: "Payment pending",
    failed: "Payment failed",
    refunded: "Refunded",
    cancelled: "Cancelled",
    exported: "Exported for claiming",
  };
  return labels[status] ?? status;
}

export function normalizeLegacyStatus(status: string): BillingInvoiceState {
  if (status === "cancelled") return "cancelled";
  return status as BillingInvoiceState;
}
