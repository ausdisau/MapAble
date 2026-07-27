import { describe, expect, it } from "vitest";

import {
  preparePaymentInstruction,
  reconcileInvoiceDeterministically,
} from "@/lib/abilitypay/abilitypay-service";

describe("AbilityPay deterministic reconciliation", () => {
  it("matches an invoice with expected cost and service evidence", () => {
    const result = reconcileInvoiceDeterministically({
      invoiceId: "invoice-1",
      invoicedTotalCents: 12500,
      expectedTotalCents: 12500,
      serviceEvidencePresent: true,
    });
    expect(result.overallStatus).toBe("matched");
    expect(result.differences).toEqual([]);
  });

  it("uses neutral duplicate and evidence labels", () => {
    const result = reconcileInvoiceDeterministically({
      invoiceId: "invoice-2",
      invoicedTotalCents: 13000,
      expectedTotalCents: 12500,
      serviceEvidencePresent: false,
      duplicateInvoiceId: "invoice-1",
    });
    expect(result.overallStatus).toBe("participant_review");
    expect(result.duplicateIndicators[0]?.code).toBe("POSSIBLE_DUPLICATE");
    expect(JSON.stringify(result)).not.toMatch(/fraudulent/i);
  });

  it("never enables payment execution", () => {
    expect(preparePaymentInstruction()).toEqual({
      status: "preparation_only",
      executable: false,
      reason:
        "Payment execution is disabled and requires authorised human review.",
    });
  });
});
