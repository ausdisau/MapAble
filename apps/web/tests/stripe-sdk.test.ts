import { describe, expect, it } from "vitest";

import {
  isStripeIntegrationEnabled,
  isStripeSdkAvailable,
} from "@/lib/stripe/config";
import {
  billingCheckoutMetadata,
  legacyInvoiceIdFromMetadata,
  legacyInvoiceMetadata,
} from "@/lib/stripe/metadata";

describe("Stripe SDK configuration", () => {
  it("SDK unavailable without secret key in test env", () => {
    expect(isStripeSdkAvailable()).toBe(false);
  });

  it("integration flag requires enable env plus key", () => {
    expect(isStripeIntegrationEnabled()).toBe(false);
  });
});

describe("Stripe metadata helpers", () => {
  it("builds billing checkout metadata", () => {
    const meta = billingCheckoutMetadata({
      invoiceId: "inv_1",
      userId: "user_1",
      serviceType: "care",
      bookingId: "book_1",
    });
    expect(meta.invoiceId).toBe("inv_1");
    expect(meta.userId).toBe("user_1");
    expect(meta.bookingId).toBe("book_1");
  });

  it("reads legacy invoice id from metadata", () => {
    expect(
      legacyInvoiceIdFromMetadata({ mapable_invoice_id: "legacy_inv" })
    ).toBe("legacy_inv");
    expect(legacyInvoiceIdFromMetadata({ invoiceId: "billing_inv" })).toBe(
      "billing_inv"
    );
  });

  it("builds legacy invoice metadata", () => {
    const meta = legacyInvoiceMetadata({
      invoiceId: "inv_2",
      userId: "user_2",
      purpose: "participant_copay",
    });
    expect(meta.mapable_invoice_id).toBe("inv_2");
    expect(meta.payment_purpose).toBe("participant_copay");
  });
});
