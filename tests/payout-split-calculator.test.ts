import { describe, expect, it } from "vitest";

import { payoutPolicyDefaults } from "@/lib/payouts/config";
import { checkPriceRules } from "@/lib/payouts/price-rules";
import { calculatePayoutSplits } from "@/lib/payouts/split-calculator";

describe("calculatePayoutSplits", () => {
  it("allocates worker share with zero-fee pilot", () => {
    const result = calculatePayoutSplits({
      bookingType: "care",
      grossAmountCents: 10_000,
      lineItems: [
        {
          description: "Support shift",
          lineType: "worker_service",
          recipientId: "worker-1",
          totalAmountCents: 10_000,
        },
      ],
      recipients: [
        { recipientType: "support_worker", recipientId: "worker-1" },
      ],
      platformFeePolicy: { feeBps: 0, zeroFeePilot: true },
    });
    expect(result.validationErrors).toHaveLength(0);
    expect(result.totalNetTransferCents).toBe(10_000);
    expect(result.splits[0]?.netTransferCents).toBe(10_000);
  });

  it("applies platform fee when pilot mode off", () => {
    const result = calculatePayoutSplits({
      bookingType: "care",
      grossAmountCents: 10_000,
      lineItems: [
        {
          description: "Support shift",
          lineType: "worker_service",
          recipientId: "worker-1",
          totalAmountCents: 10_000,
        },
      ],
      recipients: [
        { recipientType: "support_worker", recipientId: "worker-1" },
      ],
      platformFeePolicy: { feeBps: 1000, zeroFeePilot: false },
    });
    expect(result.totalPlatformFeeCents).toBeGreaterThan(0);
  });

  it("blocks split calculation when service disputed", () => {
    const result = calculatePayoutSplits({
      bookingType: "transport",
      grossAmountCents: 5000,
      lineItems: [],
      recipients: [],
      serviceCompletionStatus: "disputed",
    });
    expect(result.validationErrors.length).toBeGreaterThan(0);
  });

  it("splits care and transport line items", () => {
    const result = calculatePayoutSplits({
      bookingType: "care",
      grossAmountCents: 20_000,
      lineItems: [
        {
          description: "Care",
          lineType: "worker_service",
          recipientId: "w1",
          totalAmountCents: 13_000,
        },
        {
          description: "Transport",
          lineType: "transport",
          recipientId: "t1",
          totalAmountCents: 7_000,
        },
      ],
      recipients: [
        { recipientType: "support_worker", recipientId: "w1" },
        { recipientType: "transport_operator", recipientId: "t1" },
      ],
    });
    expect(result.splits.length).toBeGreaterThanOrEqual(2);
  });
});

describe("checkPriceRules", () => {
  it("fails negative amounts", () => {
    const result = checkPriceRules({
      bookingType: "care",
      fundingSourceType: "private_card",
      lineItems: [
        { description: "Bad", unitAmountCents: -100, quantity: 1 },
      ],
    });
    expect(result.pass).toBe(false);
  });

  it("warns on missing NDIS line item", () => {
    const result = checkPriceRules({
      bookingType: "care",
      fundingSourceType: "ndis_self_managed",
      lineItems: [
        { description: "Support", unitAmountCents: 6500, quantity: 2 },
      ],
    });
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe("payoutPolicyDefaults", () => {
  it("uses separate charges and transfers by default", () => {
    expect(payoutPolicyDefaults.useSeparateChargesAndTransfers).toBe(true);
  });

  it("zero fee pilot enabled", () => {
    expect(payoutPolicyDefaults.zeroFeePilotMode).toBe(true);
  });
});
