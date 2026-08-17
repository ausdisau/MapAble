import { describe, expect, it } from "vitest";

import {
  addCents,
  allocateProportionally,
  applyBps,
  formatAud,
  fromCents,
  invoiceTotals,
  multiplyCents,
  subtractCents,
  sumLineTotals,
  toCents,
} from "@/lib/billing/money";

describe("billing money arithmetic", () => {
  it("converts dollars to cents without float drift", () => {
    expect(toCents(10.1)).toBe(1010);
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(0.005)).toBe(1);
  });

  it("formats AUD from cents", () => {
    expect(formatAud(13000)).toBe("$130.00");
    expect(formatAud(-50)).toBe("-$0.50");
  });

  it("adds and subtracts cents safely", () => {
    expect(addCents(100, 250, 3)).toBe(353);
    expect(subtractCents(1000, 250)).toBe(750);
  });

  it("multiplies quantity by unit rate with rounding", () => {
    expect(multiplyCents(6500, 2)).toBe(13000);
    expect(multiplyCents(3333, 1.5)).toBe(5000);
  });

  it("applies basis points with half-up rounding", () => {
    expect(applyBps(10000, 1000)).toBe(1000); // 10%
    expect(applyBps(101, 1000)).toBe(10);
  });

  it("allocates proportionally with largest remainder", () => {
    const parts = allocateProportionally(100, [1, 1, 1]);
    expect(parts.reduce((s, v) => s + v, 0)).toBe(100);
    expect(parts).toEqual([34, 33, 33]);
  });

  it("computes invoice totals with platform fee and GST", () => {
    const totals = invoiceTotals({
      lines: [
        { quantity: 2, unitAmountCents: 6500, gstApplicable: false },
        { quantity: 1, unitAmountCents: 1000, gstApplicable: true },
      ],
      platformFeeBps: 1000,
      gstBps: 1000,
      discountCents: 0,
      coPaymentCents: 500,
    });
    expect(totals.subtotalCents).toBe(14000);
    expect(totals.platformFeeCents).toBe(1400);
    expect(totals.gstCents).toBe(100);
    expect(totals.coPaymentCents).toBe(500);
    expect(totals.totalPayableCents).toBe(16000);
  });

  it("rejects non-integer cents", () => {
    expect(() => fromCents(1.5 as number)).toThrow(/integer/);
  });

  it("sums line totals", () => {
    expect(
      sumLineTotals([
        { quantity: 1, unitAmountCents: 100 },
        { quantity: 2, unitAmountCents: 50 },
      ])
    ).toBe(200);
  });
});
