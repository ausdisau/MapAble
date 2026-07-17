import { notifyUser } from "@/lib/notifications/notification-service";
import { plainLanguageStatus } from "@/lib/billing/invoicing/state-machine";
import type { BillingInvoiceState } from "@/types/billing";

export type BillingNotificationEvent =
  | "invoice_ready_for_review"
  | "invoice_issued"
  | "invoice_paid"
  | "invoice_overdue"
  | "approval_requested"
  | "payment_recorded"
  | "dispute_opened"
  | "claim_batch_exported"
  | "payout_approved"
  | "policy_review_required";

export type NotifyBillingEventInput = {
  userId: string;
  event: BillingNotificationEvent;
  invoiceId?: string;
  invoiceNumber?: string | null;
  status?: BillingInvoiceState | string;
  /** Non-sensitive short context only — never include clinical notes, diagnoses, or full addresses. */
  preview?: string;
};

const TITLES: Record<BillingNotificationEvent, string> = {
  invoice_ready_for_review: "Invoice ready for your review",
  invoice_issued: "Invoice issued",
  invoice_paid: "Payment received",
  invoice_overdue: "Invoice overdue reminder",
  approval_requested: "Approval requested",
  payment_recorded: "Payment recorded",
  dispute_opened: "Invoice question opened",
  claim_batch_exported: "Claim pack exported",
  payout_approved: "Provider payout approved",
  policy_review_required: "Pricing review needed",
};

/**
 * Wrap notifyUser for billing events with non-sensitive previews only.
 * Does not include dollar amounts in the default body unless passed as a sanitized preview.
 */
export async function notifyBillingEvent(input: NotifyBillingEventInput) {
  const title = TITLES[input.event];
  const statusLabel = input.status
    ? plainLanguageStatus(input.status as BillingInvoiceState)
    : null;

  const parts: string[] = [];
  if (input.invoiceNumber) {
    parts.push(`Invoice ${input.invoiceNumber}`);
  } else if (input.invoiceId) {
    parts.push("An invoice");
  }
  if (statusLabel) {
    parts.push(`Status: ${statusLabel}`);
  }
  if (input.preview) {
    parts.push(sanitizeBillingPreview(input.preview));
  }

  const body =
    parts.length > 0
      ? parts.join(". ") + "."
      : "There is an update in Billing Centre. Open Billing to review.";

  return notifyUser(input.userId, "billing", title, body);
}

/** Strip potentially sensitive tokens from free-text previews. */
export function sanitizeBillingPreview(text: string): string {
  const blocked =
    /\b(diagnosis|medication|psychiatric|suicide|self-harm|NDIS number|medicare|address)\b/gi;
  return text.replace(blocked, "[redacted]").slice(0, 200);
}
