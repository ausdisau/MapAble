import { z } from "zod";

export const fundingSplitSchema = z.object({
  funded: z.number().nonnegative(),
  coPayment: z.number().nonnegative(),
  private: z.number().nonnegative(),
  employer: z.number().nonnegative(),
});

export const verticalSplitBucketSchema = z.object({
  key: z.string().min(1).max(64),
  weight: z.number().positive(),
  lineType: z.enum([
    "direct_support",
    "travel",
    "non_labour",
    "cancellation",
    "platform_fee",
    "co_payment",
    "ingredient",
    "preparation",
    "delivery",
    "subscription",
    "commission",
    "other",
  ]),
});

export const verticalSplitSchema = z.object({
  buckets: z.array(verticalSplitBucketSchema).min(1),
});

export const createServiceRecordSchema = z.object({
  organisationId: z.string().cuid().optional().nullable(),
  participantId: z.string().cuid(),
  sourceType: z.enum([
    "care_shift",
    "timesheet",
    "transport_trip",
    "employment_session",
    "foods_order",
    "marketplace_transaction",
    "subscription_period",
    "cancellation",
    "travel_cost",
    "non_labour_cost",
    "other",
  ]),
  sourceId: z.string().min(1).max(200),
  serviceType: z.enum([
    "care",
    "transport",
    "jobs",
    "foods",
    "moves",
    "academy",
    "marketplace",
    "subscription",
    "other",
  ]),
  serviceStart: z.string().datetime(),
  serviceEnd: z.string().datetime().optional().nullable(),
  quantity: z.number().positive().optional(),
  unit: z.string().max(40).optional(),
  supportItemCode: z.string().max(50).optional().nullable(),
  workerOrProviderId: z.string().optional().nullable(),
  fundingSourceType: z
    .enum([
      "ndis_plan_managed",
      "ndis_self_managed",
      "ndis_agency_managed",
      "private_card",
      "private_pay",
      "organisation_invoice",
      "employer_funded",
      "insurance",
      "home_care_package",
      "grant",
      "grant_funded",
      "mixed",
      "other",
    ])
    .optional()
    .nullable(),
  estimatedCents: z.number().int().nonnegative().optional(),
  notesForBilling: z.string().max(2000).optional().nullable(),
});

export const lockServiceRecordSchema = z.object({
  serviceRecordId: z.string().cuid(),
  reason: z.string().max(500).optional(),
});

export const attachEvidenceSchema = z.object({
  serviceRecordId: z.string().cuid(),
  evidenceType: z.string().min(1).max(100),
  summary: z.string().min(1).max(1000),
  referenceId: z.string().max(200).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createDraftFromRecordsSchema = z.object({
  participantId: z.string().cuid(),
  serviceRecordIds: z.array(z.string().cuid()).min(1),
  providerId: z.string().cuid().optional().nullable(),
  fundingSourceId: z.string().cuid().optional().nullable(),
  dueAt: z.string().datetime().optional(),
  fundingSplit: fundingSplitSchema.optional(),
  verticalSplit: verticalSplitSchema.optional(),
  notesForBilling: z.string().max(2000).optional(),
});

export const transitionInvoiceSchema = z.object({
  invoiceId: z.string().cuid(),
  to: z.string().min(1),
  reason: z.string().max(1000).optional(),
  relatedEvidenceIds: z.array(z.string()).optional(),
});

export const issueInvoiceSchema = z.object({
  invoiceId: z.string().cuid(),
  reason: z.string().max(1000).optional(),
});

export const requestApprovalSchema = z.object({
  invoiceId: z.string().cuid(),
  approvalType: z.enum(["participant", "provider", "mapable_finance"]),
  reason: z.string().max(1000).optional(),
});

export const approveInvoiceSchema = z.object({
  invoiceId: z.string().cuid(),
  approvalType: z.enum(["participant", "provider", "mapable_finance"]),
  decision: z
    .enum(["approved", "rejected", "changes_requested"])
    .optional(),
  reason: z.string().max(1000).optional(),
});

export const createApprovalSchema = z.object({
  invoiceId: z.string().cuid(),
  approvalType: z.enum(["participant", "provider", "mapable_finance"]),
  decision: z
    .enum(["pending", "approved", "rejected", "changes_requested"])
    .optional(),
  reason: z.string().max(1000).optional(),
});

export const recordManualPaymentSchema = z.object({
  invoiceId: z.string().cuid(),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).optional(),
  externalReference: z.string().max(200).optional(),
  paidAt: z.string().datetime().optional(),
  reason: z.string().max(1000).optional(),
});

export const refundPaymentStubSchema = z.object({
  paymentId: z.string().cuid(),
  amountCents: z.number().int().positive(),
  reason: z.string().min(1).max(1000),
});

export const createReconciliationSessionSchema = z.object({
  organisationId: z.string().cuid().optional().nullable(),
  source: z.string().min(1).max(100),
  notes: z.string().max(2000).optional(),
});

export const suggestMatchesSchema = z.object({
  sessionId: z.string().cuid(),
  payments: z
    .array(
      z.object({
        id: z.string().min(1),
        amountCents: z.number().int().positive(),
        payerName: z.string().max(200).optional().nullable(),
        reference: z.string().max(200).optional().nullable(),
        paidAt: z.string().datetime().optional().nullable(),
      })
    )
    .min(1),
});

export const confirmMatchSchema = z.object({
  matchId: z.string().cuid(),
  notes: z.string().max(1000).optional(),
});

export const createClaimBatchSchema = z.object({
  organisationId: z.string().cuid(),
  invoiceIds: z.array(z.string().cuid()).min(1),
  gateway: z
    .enum(["mock", "csv_export", "plan_manager", "official_disabled"])
    .optional(),
});

export const claimBatchIdSchema = z.object({
  batchId: z.string().cuid(),
});

export const calculatePayoutsSchema = z.object({
  organisationId: z.string().cuid(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  commissionBps: z.number().int().nonnegative().optional(),
  allowUnpaidOrDisputed: z.boolean().optional(),
});

export const approvePayoutSchema = z.object({
  payoutId: z.string().cuid(),
  reason: z.string().max(1000).optional(),
});

export const releasePayoutSchema = z.object({
  payoutId: z.string().cuid(),
  destinationRef: z.string().max(200).optional(),
  reason: z.string().max(1000).optional(),
});

export const activatePolicyVersionSchema = z.object({
  policyVersionId: z.string().cuid(),
  reason: z.string().max(1000).optional(),
});

export const validateRateSchema = z.object({
  supportItemNumber: z.string().min(1).max(50),
  unitRateCents: z.number().int().nonnegative(),
  asOf: z.string().datetime().optional(),
  organisationId: z.string().cuid().optional().nullable(),
  weekdayOrTimeBand: z.string().max(50).optional().nullable(),
});

export const xeroSyncSchema = z.object({
  invoiceId: z.string().cuid(),
  organisationId: z.string().cuid().optional().nullable(),
  idempotencyKey: z.string().max(200).optional(),
});

export const copilotSuggestionsSchema = z.object({
  invoiceId: z.string().cuid().optional(),
  serviceRecordId: z.string().cuid().optional(),
  paymentId: z.string().cuid().optional(),
  matchSessionId: z.string().cuid().optional(),
});

export const safeguardCheckSchema = z.object({
  invoiceId: z.string().cuid().optional(),
  serviceRecordId: z.string().cuid().optional(),
  organisationId: z.string().cuid().optional().nullable(),
});
