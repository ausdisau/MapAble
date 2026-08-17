import type {
  NdisClaimBatchStatus,
  NdisClaimLineStatus,
  NdisClaimType,
  NdisPaymentRoute,
  NdisServiceDeliveryMechanism,
} from "@prisma/client";

export type { NdisPaymentRoute, NdisClaimLineStatus, NdisClaimBatchStatus };

/** Portal-assisted workflow — no government credentials stored. */
export type NdisFundingRoute = NdisPaymentRoute;

export const FUNDING_ROUTE_LABELS: Record<NdisPaymentRoute, string> = {
  self_managed: "Self-managed",
  plan_managed: "Plan-managed",
  ndia_managed: "NDIA-managed (agency)",
};

export type ClaimValidationIssue = {
  code: string;
  field?: string;
  message: string;
  severity: "error" | "warning";
};

export type ClaimValidationResult = {
  valid: boolean;
  issues: ClaimValidationIssue[];
  checkedAt: string;
};

export type ClaimLineInput = {
  participantId: string;
  providerOrgId: string;
  bookingId?: string | null;
  invoiceId?: string | null;
  ndisParticipantNumber?: string | null;
  participantName: string;
  supportItemCode: string;
  supportDescription: string;
  serviceStartDate: string;
  serviceEndDate: string;
  quantity: number;
  unitPriceCents: number;
  totalAmountCents: number;
  paymentRoute: NdisPaymentRoute;
  claimType?: NdisClaimType;
  deliveryMechanism?: NdisServiceDeliveryMechanism | null;
  cancellationReason?: string | null;
  evidenceJson?: Record<string, unknown> | null;
  participantConfirmationException?: string | null;
};

export type ClaimLineEvidence = {
  deliveryRecorded?: boolean;
  timesheetIds?: string[];
  shiftIds?: string[];
  participantConfirmedAt?: string | null;
  participantConfirmationException?: string | null;
  notes?: string | null;
};

export type BulkPaymentRequestRow = {
  participantNumber: string;
  participantName: string;
  supportItemCode: string;
  supportDescription: string;
  serviceStartDate: string;
  serviceEndDate: string;
  quantity: string;
  unitPrice: string;
  totalAmount: string;
  claimReference: string;
};

export type BulkPaymentRequestExport = {
  format: "ndia_bulk_payment_request_csv";
  providerRegistrationNumber: string;
  batchReference: string;
  exportedAt: string;
  lineCount: number;
  rows: BulkPaymentRequestRow[];
  /** CSV content — only lines in this batch (no unrelated participants). */
  csv: string;
};

export type NdisInvoiceDraft = {
  invoiceNumber: string;
  recipientType: "participant" | "plan_manager";
  recipientName: string;
  recipientEmail?: string | null;
  lines: Array<{
    supportItemCode: string;
    description: string;
    serviceDate: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }>;
  totalCents: number;
};

export type ClaimBatchExportResult = {
  batchId: string;
  paymentRoute: NdisPaymentRoute;
  adapter: "portal_export" | "self_managed_invoice" | "plan_manager_invoice";
  fileName: string;
  checksum: string;
  contentType: string;
  /** Base64 for download APIs; CSV/text only includes batch participants. */
  payloadBase64: string;
  lineCount: number;
};

export type NdisClaimingAdapter = {
  submitClaimBatch(batchId: string): Promise<{ externalReference?: string }>;
  getClaimStatus(externalReference: string): Promise<{ status: string }>;
  getParticipantBudget?(participantNumber: string): Promise<unknown>;
  getProviderRelationshipStatus?(
    participantNumber: string,
    providerRegistrationNumber: string
  ): Promise<{ status: string }>;
};

export type ClaimLineStatusUpdate =
  | "submitted"
  | "pending"
  | "paid"
  | "rejected"
  | "corrected"
  | "resubmitted"
  | "voided";
