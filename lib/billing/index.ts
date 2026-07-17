/**
 * MapAble Billing Centre — public domain API.
 * Prefer these exports over reaching into nested modules from route handlers.
 */

// Money
export {
  toCents,
  fromCents,
  formatAud,
  addCents,
  subtractCents,
  multiplyCents,
  applyBps,
  allocateProportionally,
  sumLineTotals,
  calculateGstOnLines,
  invoiceTotals,
  type Cents,
} from "@/lib/billing/money";

// Permissions
export {
  hasBillingPermission,
  listBillingPermissions,
  canAccessBillingCentre,
} from "@/lib/billing/permissions";

// Audit
export {
  writeFinancialAudit,
  type WriteFinancialAuditInput,
} from "@/lib/billing/audit/financial-audit";

// Policy
export {
  findActivePricingRule,
  validateRateAgainstPolicy,
  activatePolicyVersion,
} from "@/lib/billing/policy/registry";
export {
  validateChargeLinesAgainstPolicy,
  validateAgainstPolicy,
} from "@/lib/billing/policy/validate";

// Service records
export {
  createFromSource,
  lockServiceRecord,
  listUnbilled,
  attachEvidence,
  assertServiceRecordLocked,
} from "@/lib/billing/service-records/service";

// Charge calculations
export {
  generateChargeLinesFromServiceRecord,
  toPrismaLineType,
  defaultFoodsSplit,
  defaultCareTravelSplit,
} from "@/lib/billing/calculations/charge";

// Invoicing
export {
  assertCanTransition,
  isTransitionAllowed,
  canEditAmounts,
  plainLanguageStatus,
  normalizeLegacyStatus,
  IMMUTABLE_AMOUNT_STATES,
} from "@/lib/billing/invoicing/state-machine";
export {
  transitionInvoice,
  issueInvoice,
  requestApproval,
  approveInvoice,
} from "@/lib/billing/invoicing/issue";
export { createDraftFromServiceRecords } from "@/lib/billing/invoicing/draft";

// Approvals
export {
  createApproval,
  listApprovals,
  decideApproval,
} from "@/lib/billing/approvals/service";

// Payments
export {
  recordManualPayment,
  allocatePaymentToInvoice,
  refundPaymentStub,
} from "@/lib/billing/payments/service";

// Reconciliation
export {
  createReconciliationSession,
  suggestMatches,
  confirmMatch,
} from "@/lib/billing/reconciliation/service";

// Claims
export {
  getClaimsGateway,
  MockClaimsGateway,
  CsvExportClaimsGateway,
  PlanManagerClaimsGateway,
  OfficialDisabledClaimsGateway,
} from "@/lib/billing/claims/gateway";
export {
  createClaimBatch,
  validateClaimBatch,
  exportClaimBatch,
} from "@/lib/billing/claims/batch-service";

// Payouts
export {
  calculateProviderPayables,
  approveProviderPayout,
  releaseProviderPayout,
} from "@/lib/billing/payouts/service";

// Integrations
export {
  connectXero,
  syncInvoiceToXero,
  getBillingXeroStatus,
} from "@/lib/billing/integrations/xero-facade";

// Safeguards & copilot
export { runSafeguardChecks } from "@/lib/billing/safeguards/rules";
export { generateBillingCopilotSuggestions } from "@/lib/billing/copilot/suggestions";

// Notifications & overview
export {
  notifyBillingEvent,
  sanitizeBillingPreview,
} from "@/lib/billing/notifications";
export { computeBillingOverviewKpis } from "@/lib/billing/overview/kpis";
