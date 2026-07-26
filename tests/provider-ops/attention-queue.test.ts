import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";

vi.mock("@/lib/config/provider-ops", () => ({
  isProviderOpsEnabled: () => true,
}));

vi.mock("@/lib/billing/access", () => ({
  assertCanAccessBillingOrganisation: vi.fn().mockResolvedValue(undefined),
  BillingAccessError: class BillingAccessError extends Error {
    status = 403;
  },
}));

const careShiftFindMany = vi.fn();
const workerFindMany = vi.fn();
const tripFindMany = vi.fn();
const invoiceFindMany = vi.fn();
const incidentFindMany = vi.fn();
const auditFindMany = vi.fn();
const auditFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    careShift: { findMany: (...a: unknown[]) => careShiftFindMany(...a) },
    workerProfile: { findMany: (...a: unknown[]) => workerFindMany(...a) },
    transportTrip: { findMany: (...a: unknown[]) => tripFindMany(...a) },
    billingInvoice: { findMany: (...a: unknown[]) => invoiceFindMany(...a) },
    incidentReport: { findMany: (...a: unknown[]) => incidentFindMany(...a) },
    auditEvent: {
      findMany: (...a: unknown[]) => auditFindMany(...a),
      findFirst: (...a: unknown[]) => auditFindFirst(...a),
    },
  },
}));

import { buildProviderAttentionQueue } from "@/lib/provider/ops/attention-queue";

const provider: CurrentUser = {
  id: "prov-1",
  email: "p@test.com",
  name: "Provider",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "provider_admin",
  roles: ["provider_admin"],
};

describe("Provider Operations attention queue", () => {
  beforeEach(() => {
    careShiftFindMany.mockResolvedValue([
      {
        id: "s1",
        participantId: "participant-abc123",
        startAt: new Date("2026-07-18T01:00:00.000Z"),
        status: "scheduled",
      },
    ]);
    workerFindMany.mockResolvedValue([
      {
        id: "w1",
        displayName: "Worker",
        workerScreeningStatus: "expired",
        wwccStatus: "verified",
      },
    ]);
    tripFindMany.mockResolvedValue([]);
    invoiceFindMany.mockResolvedValue([]);
    incidentFindMany.mockResolvedValue([]);
    auditFindMany.mockResolvedValue([]);
    auditFindFirst.mockResolvedValue(null);
  });

  it("returns read-only items with minimised participant refs", async () => {
    const queue = await buildProviderAttentionQueue({
      user: provider,
      organisationId: "org-1",
    });
    expect(queue.readOnly).toBe(true);
    expect(queue.autoEscalation).toBe(false);
    expect(queue.providerRanking).toBe(false);
    expect(queue.items.some((i) => i.kind === "essential_shift_unfilled")).toBe(
      true,
    );
    expect(queue.items.some((i) => i.kind === "worker_credential_expiring")).toBe(
      true,
    );
    const shift = queue.items.find((i) => i.kind === "essential_shift_unfilled");
    expect(shift?.participantRef).toMatch(/^participant:/);
    expect(shift?.participantRef).not.toContain("participant-abc123");
    expect(shift?.deepLink).toContain("/care/shifts/");
  });

  it("orders by deadline before severity and never fabricates rankings", async () => {
    careShiftFindMany.mockResolvedValue([
      {
        id: "s-later",
        participantId: "participant-later",
        startAt: new Date("2026-07-20T01:00:00.000Z"),
        status: "scheduled",
      },
      {
        id: "s-soon",
        participantId: "participant-soon",
        startAt: new Date("2026-07-18T01:00:00.000Z"),
        status: "scheduled",
      },
    ]);
    workerFindMany.mockResolvedValue([]);
    const queue = await buildProviderAttentionQueue({
      user: provider,
      organisationId: "org-1",
    });
    const shifts = queue.items.filter((i) => i.kind === "essential_shift_unfilled");
    expect(shifts[0]?.id).toBe("shift_unfilled_s-soon");
    expect(shifts[1]?.id).toBe("shift_unfilled_s-later");
  });
});
