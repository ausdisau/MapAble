import type {
  BillingFundingSourceType,
  BillingInvoiceLineType,
  BillingPaymentSplitRecipient,
  BillingPayerType,
  BillingServiceType,
  PayoutRecipientType,
} from "@prisma/client";

export type PayoutSplitDraft = {
  recipientType: BillingPaymentSplitRecipient;
  recipientId?: string;
  payoutRecipientId?: string;
  grossShareCents: number;
  platformFeeCents: number;
  adjustmentsCents: number;
  reserveCents: number;
  netTransferCents: number;
  role: BillingPaymentSplitRecipient;
};

export type CalculatePayoutSplitsInput = {
  paymentId?: string;
  bookingType: BillingServiceType;
  grossAmountCents: number;
  lineItems: Array<{
    description: string;
    lineType?: BillingInvoiceLineType;
    recipientId?: string;
    totalAmountCents: number;
  }>;
  recipients: Array<{
    recipientType: PayoutRecipientType;
    recipientId: string;
    payoutRecipientId?: string;
  }>;
  platformFeePolicy?: { feeBps: number; zeroFeePilot?: boolean };
  reservePolicy?: { reserveBps: number; fixedReserveCents?: number };
  fundingSourceType?: BillingFundingSourceType;
  serviceCompletionStatus?: "pending" | "completed" | "disputed";
};

export type CalculatePayoutSplitsResult = {
  splits: PayoutSplitDraft[];
  totalGrossCents: number;
  totalPlatformFeeCents: number;
  totalReserveCents: number;
  totalNetTransferCents: number;
  validationErrors: string[];
  warnings: string[];
};

export type PayoutReadinessResult = {
  eligible: boolean;
  status: string;
  blockers: string[];
  requiredActions: string[];
  attestations: Array<{ id: string; type: string; createdAt: Date }>;
};

export type CreateBookingPaymentInput = {
  bookingId: string;
  bookingType: BillingServiceType;
  userId: string;
  providerId?: string;
  payerType: BillingPayerType;
  fundingSourceType: BillingFundingSourceType;
  fundingSourceId?: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitAmountCents: number;
    lineType?: BillingInvoiceLineType;
    recipientId?: string;
    serviceCategory?: string;
    ndisLineItem?: string;
    gstApplicable?: boolean;
  }>;
  recipientSplits?: Array<{
    recipientType: BillingPaymentSplitRecipient;
    recipientId: string;
    amountCents: number;
  }>;
  currency?: string;
};
