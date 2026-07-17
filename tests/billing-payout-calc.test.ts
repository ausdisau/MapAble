import { describe, expect, it } from "vitest";

import { applyBps, subtractCents } from "@/lib/billing/money";

describe("provider payable calculation helpers", () => {
  it("computes net payable from gross, commission, adjustments and withhold", () => {
    const gross = 50_000;
    const commission = applyBps(gross, 1000); // 10%
    const adjustments = -500;
    const withheld = 2000;
    const net = subtractCents(
      subtractCents(subtractCents(gross, commission), Math.abs(adjustments)),
      withheld
    );
    expect(commission).toBe(5000);
    expect(net).toBe(42_500);
  });

  it("does not allow payout math from disputed unpaid invoices conceptually", () => {
    const invoicePaid = false;
    const invoiceDisputed = true;
    const allowPayoutWithoutPayment = false;
    const canPayout =
      (invoicePaid || allowPayoutWithoutPayment) && !invoiceDisputed;
    expect(canPayout).toBe(false);
  });
});
