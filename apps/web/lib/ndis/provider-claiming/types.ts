export type NdiaProviderClaimLine = {
  lineNumber: number;
  supportItemCode: string;
  description: string;
  serviceDate: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  gstIncluded: boolean;
};

/** Payload shape aligned with NDIA provider payment/claim APIs (PACE-oriented). */
export type NdiaProviderClaimPayload = {
  claimType: "registered_provider";
  provider: {
    abn: string | null;
    ndisRegistrationNumber: string;
    organisationId: string;
    name: string;
  };
  participant: {
    ndisNumber: string | null;
    ndisNumberMasked: string | null;
    mapableUserId: string;
  };
  invoiceReference: {
    mapableLegacyInvoiceId?: string;
    mapableBillingInvoiceId?: string;
    invoiceNumber?: string | null;
  };
  servicePeriod: {
    start: string;
    end: string;
  };
  lines: NdiaProviderClaimLine[];
  totals: {
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
    currency: string;
  };
  metadata: {
    builtAt: string;
    mapableVersion: string;
  };
};

export type ClaimValidationFinding = {
  code: string;
  severity: "error" | "warning";
  message: string;
};
