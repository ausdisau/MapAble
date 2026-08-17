import { describe, expect, it, vi } from "vitest";

import { canReleasePayout } from "@/lib/payouts/readiness-service";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    billingPayment: {
      findUnique: vi.fn(),
    },
    careServiceLog: { findFirst: vi.fn() },
    transportBooking: { findFirst: vi.fn() },
    transportTrip: { findFirst: vi.fn() },
    attestation: { findMany: vi.fn().mockResolvedValue([]) },
    supportTicket: { findMany: vi.fn().mockResolvedValue([]) },
    providerPayoutHold: { findFirst: vi.fn().mockResolvedValue(null) },
  },
}));

import { prisma } from "@/lib/prisma";

describe("canReleasePayout", () => {
  it("blocks when payment not found", async () => {
    vi.mocked(prisma.billingPayment.findUnique).mockResolvedValue(null);
    const result = await canReleasePayout("missing");
    expect(result.eligible).toBe(false);
    expect(result.blockers[0]).toContain("not found");
  });

  it("blocks when payment not received", async () => {
    vi.mocked(prisma.billingPayment.findUnique).mockResolvedValue({
      id: "pay-1",
      status: "requires_payment",
      invoiceId: "inv-1",
      payoutBlocks: [],
      splits: [],
      invoice: { bookingId: "b1", booking: { status: "completed", participantId: "p1" } },
    } as never);
    vi.mocked(prisma.careServiceLog.findFirst).mockResolvedValue({ id: "log-1" } as never);
    vi.mocked(prisma.transportBooking.findFirst).mockResolvedValue(null);
    const result = await canReleasePayout("pay-1");
    expect(result.eligible).toBe(false);
    expect(result.blockers.some((b) => b.includes("not been received"))).toBe(true);
  });
});
