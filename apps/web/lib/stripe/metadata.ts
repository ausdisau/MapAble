import type { StripePaymentPurpose } from "@prisma/client";
import type Stripe from "stripe";

/** Stripe metadata values must be strings; keep keys stable for webhooks. */
export function billingCheckoutMetadata(params: {
  invoiceId: string;
  userId: string;
  serviceType?: string;
  bookingId?: string;
  paymentId?: string;
  transferGroup?: string;
  fundingSourceType?: string;
}): Record<string, string> {
  const meta: Record<string, string> = {
    invoiceId: params.invoiceId,
    userId: params.userId,
    mapableUserId: params.userId,
  };
  if (params.serviceType) meta.serviceType = params.serviceType;
  if (params.bookingId) meta.bookingId = params.bookingId;
  if (params.paymentId) meta.paymentId = params.paymentId;
  if (params.transferGroup) meta.transferGroup = params.transferGroup;
  if (params.fundingSourceType) meta.fundingSourceType = params.fundingSourceType;
  return meta;
}

export function legacyInvoiceMetadata(params: {
  invoiceId: string;
  userId: string;
  purpose: StripePaymentPurpose;
}): Record<string, string> {
  return {
    mapable_invoice_id: params.invoiceId,
    mapable_user_id: params.userId,
    payment_purpose: params.purpose,
  };
}

export function legacyInvoiceIdFromMetadata(
  metadata: Stripe.Metadata | null | undefined
): string | undefined {
  if (!metadata) return undefined;
  return metadata.invoiceId ?? metadata.mapable_invoice_id ?? undefined;
}
