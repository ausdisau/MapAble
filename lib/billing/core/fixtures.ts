import type { z } from "zod";

import type { createInvoiceSchema } from "@/lib/billing/core/schemas";

type InvoiceFixture = z.infer<typeof createInvoiceSchema>;

export const careShiftInvoiceFixture: InvoiceFixture = {
  serviceType: "care",
  bookingId: undefined,
  ndisClaimable: true,
  ndisLineItem: "01_011_0107_1_1",
  lineItems: [
    {
      description: "Personal care — 2 hour shift",
      quantity: 2,
      unitAmountCents: 6500,
      ndisLineItem: "01_011_0107_1_1",
      gstApplicable: false,
    },
  ],
};

export const transportTripInvoiceFixture: InvoiceFixture = {
  serviceType: "transport",
  lineItems: [
    {
      description: "Wheelchair accessible trip — 18 km",
      quantity: 1,
      unitAmountCents: 8500,
      gstApplicable: false,
    },
  ],
};

export const combinedCareTransportFixture: InvoiceFixture = {
  serviceType: "care",
  lineItems: [
    {
      description: "Community access support — 3 hours",
      quantity: 3,
      unitAmountCents: 5500,
      ndisLineItem: "04_104_0125_6_1",
      gstApplicable: false,
    },
    {
      description: "Transport to appointment",
      quantity: 1,
      unitAmountCents: 4200,
      gstApplicable: false,
    },
  ],
};

export const providerProSubscriptionFixture = {
  planCode: "provider_pro" as const,
};

export const marketplaceAtPurchaseFixture: InvoiceFixture = {
  serviceType: "marketplace",
  lineItems: [
    {
      description: "Assistive technology — ergonomic keyboard",
      quantity: 1,
      unitAmountCents: 18900,
      gstApplicable: true,
    },
  ],
};
