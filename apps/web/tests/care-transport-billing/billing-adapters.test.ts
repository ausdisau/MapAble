import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    careBooking: { findUnique: vi.fn() },
    careInvoiceLink: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    transportTrip: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/billing/service-records/service", () => ({
  createFromSource: vi.fn(async (input: { sourceId: string }) => ({
    id: `bsr_${input.sourceId}`,
    sourceId: input.sourceId,
  })),
  attachEvidence: vi.fn(async () => ({ id: "ev_1" })),
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/care/access-control", () => ({
  assertProviderOrgAccess: vi.fn(async () => undefined),
}));

vi.mock("@/lib/api/organisation-scope", () => ({
  OrganisationAccessError: class OrganisationAccessError extends Error {},
  assertOrganisationAccess: vi.fn(async () => undefined),
}));

import { prisma } from "@/lib/prisma";
import { createFromSource } from "@/lib/billing/service-records/service";
import { createBillableItemFromCareEvidence } from "@/lib/billing/adapters/care-evidence-adapter";
import { createBillableItemFromTransportEvidence } from "@/lib/billing/adapters/transport-evidence-adapter";
import type { CurrentUser } from "@/lib/auth/current-user";

const actor = {
  id: "provider-1",
  primaryRole: "provider_admin",
} as CurrentUser;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("care evidence billing adapter", () => {
  it("requires accepted agreement and confirmed log", async () => {
    vi.mocked(prisma.careBooking.findUnique).mockResolvedValue({
      id: "cb1",
      organisationId: "org-a",
      participantId: "taylor",
      serviceAgreement: { status: "proposed", placeholderSummary: null },
      serviceLogs: [{ id: "log1", status: "submitted" }],
    } as never);

    await expect(
      createBillableItemFromCareEvidence({ careBookingId: "cb1", actor }),
    ).rejects.toThrow("AGREEMENT_REQUIRED");
  });

  it("creates idempotent service record from confirmed evidence", async () => {
    vi.mocked(prisma.careBooking.findUnique).mockResolvedValue({
      id: "cb1",
      organisationId: "org-a",
      participantId: "taylor",
      serviceAgreement: { status: "accepted", placeholderSummary: '{"status":"accepted"}' },
      serviceLogs: [
        {
          id: "log1",
          status: "confirmed",
          durationMinutes: 120,
          submittedAt: new Date("2026-07-17T01:00:00Z"),
          confirmedAt: new Date("2026-07-17T03:00:00Z"),
          createdAt: new Date("2026-07-17T01:00:00Z"),
          workerProfileId: "wp1",
        },
      ],
    } as never);
    vi.mocked(prisma.careInvoiceLink.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.careInvoiceLink.create).mockResolvedValue({
      id: "link1",
    } as never);

    const result = await createBillableItemFromCareEvidence({
      careBookingId: "cb1",
      actor,
    });
    expect(createFromSource).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "care_shift",
        sourceId: "log1",
        serviceType: "care",
        quantity: 2,
      }),
    );
    expect(result.serviceRecord.id).toBe("bsr_log1");
  });
});

describe("transport evidence billing adapter", () => {
  it("refuses incomplete trips", async () => {
    vi.mocked(prisma.transportTrip.findUnique).mockResolvedValue({
      id: "t1",
      status: "en_route_to_pickup",
      providerOrganisationId: "org-a",
      participantId: "taylor",
    } as never);

    await expect(
      createBillableItemFromTransportEvidence({ tripId: "t1", actor }),
    ).rejects.toThrow("TRIP_NOT_COMPLETE");
  });

  it("hands off completed trips", async () => {
    vi.mocked(prisma.transportTrip.findUnique).mockResolvedValue({
      id: "t1",
      status: "trip_completed",
      providerOrganisationId: "org-a",
      participantId: "taylor",
      scheduledStart: new Date("2026-07-17T08:00:00Z"),
      scheduledEnd: new Date("2026-07-17T09:00:00Z"),
      updatedAt: new Date("2026-07-17T09:00:00Z"),
      legacyTransportBookingId: null,
    } as never);

    const result = await createBillableItemFromTransportEvidence({
      tripId: "t1",
      actor: { ...actor, primaryRole: "transport_operator" } as CurrentUser,
    });
    expect(createFromSource).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "transport_trip",
        sourceId: "t1",
        serviceType: "transport",
      }),
    );
    expect(result.serviceRecord.id).toBe("bsr_t1");
  });
});
