/**
 * Compatibility re-exports — definitions live in lib/billing/schemas.ts.
 * Existing `@/lib/billing/core/schemas` imports remain valid.
 */
export {
  checkoutSchema,
  connectOnboardingSchema,
  createFundingSourceSchema,
  createInvoiceSchema,
  exportInvoiceSchema,
  invoiceLineItemInputSchema,
  subscriptionCheckoutSchema,
} from "@/lib/billing/schemas";
