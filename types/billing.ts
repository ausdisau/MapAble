/**
 * Billing & Invoicing Centre domain types.
 * Money is always integer minor units (cents). Never use JS floats for totals.
 */

export const BILLING_INVOICE_STATES = [
  "draft",
  "evidence_required",
  "policy_review_required",
  "participant_review",
  "provider_review",
  "approved",
  "ready_to_issue",
  "issued",
  "sent",
  "partially_paid",
  "paid",
  "overdue",
  "disputed",
  "on_hold",
  "credited",
  "void",
  "written_off",
  // legacy / payment-processor aligned
  "pending_payment",
  "failed",
  "refunded",
  "cancelled",
  "exported",
] as const;

export type BillingInvoiceState = (typeof BILLING_INVOICE_STATES)[number];

export const BILLING_FUNDING_METHODS = [
  "NDIS_AGENCY_MANAGED",
  "NDIS_PLAN_MANAGED",
  "NDIS_SELF_MANAGED",
  "PRIVATE_PAY",
  "EMPLOYER_FUNDED",
  "INSURANCE",
  "HOME_CARE_PACKAGE",
  "GRANT_FUNDED",
  "MIXED",
] as const;

export type BillingFundingMethod = (typeof BILLING_FUNDING_METHODS)[number];

export const BILLING_PERMISSIONS = [
  "billing:view_own",
  "billing:view_delegated",
  "billing:view_provider",
  "billing:view_all",
  "billing:create_draft",
  "billing:edit_draft",
  "billing:approve_participant",
  "billing:approve_provider",
  "billing:issue_invoice",
  "billing:void_invoice",
  "billing:create_credit_note",
  "billing:record_payment",
  "billing:reconcile",
  "billing:manage_payouts",
  "billing:manage_policy",
  "billing:manage_integrations",
  "billing:export",
  "billing:audit",
] as const;

export type BillingPermission = (typeof BILLING_PERMISSIONS)[number];

export const CLAIM_BATCH_STATES = [
  "NOT_READY",
  "READY",
  "EXPORTED",
  "SUBMITTED",
  "ACCEPTED",
  "PARTIALLY_ACCEPTED",
  "REJECTED",
  "PAID",
  "ADJUSTMENT_REQUIRED",
  "CANCELLED",
] as const;

export type ClaimBatchState = (typeof CLAIM_BATCH_STATES)[number];

export const PROVIDER_PAYOUT_STATES = [
  "CALCULATED",
  "REVIEW_REQUIRED",
  "APPROVED",
  "SCHEDULED",
  "PROCESSING",
  "PAID",
  "FAILED",
  "HELD",
  "CANCELLED",
] as const;

export type ProviderPayoutState = (typeof PROVIDER_PAYOUT_STATES)[number];

export type MoneyCents = number;

export type FinancialAuditEvent = {
  id: string;
  organisationId: string | null;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  reason?: string;
  policyVersionId?: string;
  occurredAt: string;
  correlationId: string;
};

export type InvoiceTransitionRecord = {
  actorId: string;
  actorRole: string;
  priorState: BillingInvoiceState;
  newState: BillingInvoiceState;
  reason?: string;
  relatedEvidenceIds?: string[];
  ip?: string | null;
  sessionId?: string | null;
  occurredAt: string;
};

export type PolicyValidationResult = {
  ok: boolean;
  status: "ok" | "POLICY_REVIEW_REQUIRED" | "FAILED";
  policyVersionId?: string;
  messages: string[];
  capsExceeded: boolean;
};

export type ChargeLineInput = {
  description: string;
  supportItemCode?: string;
  unit: string;
  quantity: number;
  unitRateCents: number;
  gstApplicable: boolean;
  lineType:
    | "direct_support"
    | "travel"
    | "non_labour"
    | "cancellation"
    | "platform_fee"
    | "co_payment"
    | "ingredient"
    | "preparation"
    | "delivery"
    | "subscription"
    | "commission"
    | "other";
  fundingAllocation?: {
    fundedCents: number;
    coPaymentCents: number;
    privateCents: number;
    employerCents: number;
  };
  policyVersionId?: string;
  serviceRecordId?: string;
  workerOrProviderId?: string;
};

export type ClaimValidationResult = {
  batchId: string;
  valid: boolean;
  errors: { lineId?: string; code: string; message: string }[];
  simulated: boolean;
};

export type ClaimSubmissionResult = {
  batchId: string;
  externalReference?: string;
  status: ClaimBatchState;
  simulated: boolean;
  message: string;
};

export type ClaimStatusResult = {
  externalReference: string;
  status: ClaimBatchState;
  simulated: boolean;
  details?: string;
};

export type ClaimCancellationResult = {
  externalReference: string;
  cancelled: boolean;
  simulated: boolean;
  message: string;
};

export interface ClaimsGateway {
  validate(batchId: string): Promise<ClaimValidationResult>;
  submit(batchId: string): Promise<ClaimSubmissionResult>;
  getStatus(externalReference: string): Promise<ClaimStatusResult>;
  cancel(externalReference: string): Promise<ClaimCancellationResult>;
}

export type ReconciliationMatchSuggestion = {
  paymentId: string;
  invoiceId: string;
  confidence: number;
  reasons: (
    | "invoice_number"
    | "amount"
    | "payer"
    | "date_proximity"
    | "participant_reference"
    | "external_claim_reference"
  )[];
};

export type BillingOverviewKpis = {
  draftInvoiceCents: number;
  readyToIssueCents: number;
  issuedThisMonthCents: number;
  cashCollectedCents: number;
  overdueCents: number;
  disputedCents: number;
  unbilledCompletedServicesCents: number;
  unreconciledPaymentsCents: number;
  claimRejectionRateBps: number;
  averageDaysToPayment: number | null;
  providerPayoutsDueCents: number;
  subscriptionRevenueCents: number;
  revenueByVertical: { vertical: string; cents: number }[];
};

export type BillingCopilotSuggestion = {
  id: string;
  kind:
    | "explain_status"
    | "summarise_validation"
    | "draft_explanation"
    | "suggest_classification"
    | "compare_rate"
    | "missing_evidence"
    | "suggest_match"
    | "dispute_timeline"
    | "provider_query"
    | "plan_manager_followup"
    | "evidence_pack_summary"
    | "agreement_vs_invoice"
    | "booking_vs_line_item"
    | "reconciliation_discrepancy"
    | "participant_invoice_explanation"
    | "duplicate_candidate";
  title: string;
  body: string;
  citations: { entityType: string; entityId: string; label: string }[];
  uncertainty: "low" | "medium" | "high";
  editable: true;
  requiresHumanConfirmation: true;
  proposedAction?: never;
};
