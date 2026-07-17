import { z } from "zod";

export const createFundingSourceSchema = z.object({
  type: z.enum([
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
  ]),
  label: z.string().min(1).max(200),
  ndisParticipantNumber: z.string().max(50).optional(),
  planManagerName: z.string().max(200).optional(),
  planManagerEmail: z.string().email().optional(),
  isDefault: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const invoiceLineItemInputSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive().default(1),
  unitAmountCents: z.number().int().nonnegative(),
  ndisLineItem: z.string().max(50).optional(),
  gstApplicable: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createInvoiceSchema = z.object({
  providerId: z.string().cuid().optional(),
  bookingId: z.string().cuid().optional(),
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
  fundingSourceId: z.string().cuid().optional(),
  ndisLineItem: z.string().max(50).optional(),
  ndisClaimable: z.boolean().optional(),
  dueAt: z.string().datetime().optional(),
  lineItems: z.array(invoiceLineItemInputSchema).min(1),
  /** When multiple providers share one invoice, splits are recorded for later transfers. */
  providerSplits: z
    .array(
      z.object({
        recipientType: z.enum([
          "provider",
          "worker",
          "transport_operator",
          "mapable_platform",
        ]),
        recipientId: z.string().optional(),
        amountCents: z.number().int().positive(),
      })
    )
    .optional(),
});

export const checkoutSchema = z.object({
  invoiceId: z.string().cuid(),
});

export const exportInvoiceSchema = z.object({
  invoiceId: z.string().cuid(),
  format: z.enum(["csv", "xero", "plan_manager"]),
});

export const subscriptionCheckoutSchema = z.object({
  planCode: z.enum([
    "provider_pro",
    "employer_pro",
    "marketplace_featured",
    "other",
  ]),
});

export const connectOnboardingSchema = z.object({
  role: z.enum(["provider", "employer"]).optional(),
});
