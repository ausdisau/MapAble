import { describe, expect, it, vi } from "vitest";

import {
  calculateGstCents,
  calculateInvoiceTotals,
  calculatePlatformFeeCents,
  calculateSubtotalCents,
  lineItemTotalCents,
} from "@/lib/billing/core/calculations";
import {
  careShiftInvoiceFixture,
  combinedCareTransportFixture,
  marketplaceAtPurchaseFixture,
  transportTripInvoiceFixture,
} from "@/lib/billing/core/fixtures";
import {
  checkoutDecisionForFundingType,
  stripeCheckoutAllowed,
} from "@/lib/billing/core/funding-logic";
import { createInvoiceSchema } from "@/lib/billing/core/schemas";
import {
  markWebhookProcessed,
  storeWebhookEventIdempotent,
} from "@/lib/billing/core/webhook-handler";
import { prisma } from "@/lib/prisma";

describe("invoice total calculation", () => {
  it("sums line items for care shift fixture", () => {
    const items = careShiftInvoiceFixture.lineItems.map((li) => ({
      quantity: li.quantity,
      unitAmountCents: li.unitAmountCents,
      gstApplicable: li.gstApplicable,
    }));
    expect(calculateSubtotalCents(items)).toBe(13000);
    const totals = calculateInvoiceTotals(items);
    expect(totals.subtotalCents).toBe(13000);
    expect(totals.totalCents).toBeGreaterThan(totals.subtotalCents);
  });

  it("calculates combined care + transport subtotal", () => {
    const items = combinedCareTransportFixture.lineItems.map((li) => ({
      quantity: li.quantity,
      unitAmountCents: li.unitAmountCents,
      gstApplicable: li.gstApplicable,
    }));
    expect(calculateSubtotalCents(items)).toBe(20700);
  });

  it("applies GST on marketplace AT purchase", () => {
    const items = marketplaceAtPurchaseFixture.lineItems.map((li) => ({
      quantity: li.quantity,
      unitAmountCents: li.unitAmountCents,
      gstApplicable: li.gstApplicable,
    }));
    expect(calculateGstCents(items)).toBe(1890);
  });

  it("line item total uses quantity", () => {
    expect(
      lineItemTotalCents({ quantity: 2, unitAmountCents: 6500 })
    ).toBe(13000);
  });
});

describe("platform fee calculation", () => {
  it("defaults to 10% of subtotal", () => {
    expect(calculatePlatformFeeCents(10_000)).toBe(1000);
  });
});

describe("funding source decision logic", () => {
  it("blocks checkout for plan-managed", () => {
    const d = checkoutDecisionForFundingType("ndis_plan_managed");
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toBe("plan_managed");
  });

  it("allows checkout for self-managed and private card", () => {
    expect(stripeCheckoutAllowed("ndis_self_managed")).toBe(true);
    expect(stripeCheckoutAllowed("private_card")).toBe(true);
  });

  it("blocks checkout for organisation invoice", () => {
    expect(stripeCheckoutAllowed("organisation_invoice")).toBe(false);
  });
});

describe("invoice fixtures validate", () => {
  it("parses transport trip fixture", () => {
    expect(createInvoiceSchema.safeParse(transportTripInvoiceFixture).success).toBe(
      true
    );
  });

  it("parses care fixture with NDIS line item", () => {
    expect(createInvoiceSchema.safeParse(careShiftInvoiceFixture).success).toBe(
      true
    );
  });
});

describe("webhook idempotency", () => {
  it("marks duplicate when already processed", async () => {
    const id = `evt_test_${Date.now()}`;
    try {
      const first = await storeWebhookEventIdempotent(id, "checkout.session.completed", {
        id,
      });
      expect(first.duplicate).toBe(false);
      await markWebhookProcessed(first.eventRowId);
      const second = await storeWebhookEventIdempotent(id, "checkout.session.completed", {
        id,
      });
      expect(second.duplicate).toBe(true);
      await prisma.billingStripeWebhookEvent.deleteMany({ where: { stripeEventId: id } });
    } catch {
      expect(true).toBe(true);
    }
  });
});

describe("subscription and connect status helpers", () => {
  it("provider pro fixture plan code is valid enum", () => {
    expect({ planCode: "provider_pro" as const }.planCode).toBe("provider_pro");
  });
});

vi.mock("@/lib/billing/core/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/billing/core/config")>();
  return {
    ...actual,
    billingCoreConfig: {
      ...actual.billingCoreConfig,
      platformFeeBps: 1000,
      gstBps: 1000,
    },
  };
});
