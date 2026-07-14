import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/phase3-scope", () => ({
  assertOrganisationAccess: vi.fn(),
}));
vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));
vi.mock("@/lib/care/worker-eligibility", () => ({
  assertWorkerEvidenceEligible: vi.fn(),
}));
vi.mock("@/lib/config/provider-workforce", () => ({
  providerWorkforceConfig: {
    providerCloudEnabled: true,
    workerCloudEnabled: true,
    workerMatchingEnabled: true,
    continuityRecoveryEnabled: true,
    shiftNoteAssistantEnabled: false,
    automaticAssignmentEnabled: false,
  },
}));
vi.mock("@/lib/prisma", () => {
  const shiftOffer = {
    upsert: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
  };
  const careShift = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  };
  return {
    prisma: {
      availabilityWindow: { findFirst: vi.fn() },
      careShift,
      shiftOffer,
      $transaction: vi.fn(async (callback) =>
        callback({ shiftOffer, careShift }),
      ),
    },
  };
});

import {
  createShiftOffer,
  participantConfirmShiftOffer,
  workerAcceptShiftOffer,
} from "@/lib/care/shift-offer-service";
import { prisma } from "@/lib/prisma";

const actor = {
  id: "provider-1",
  email: "provider@example.com",
  name: "Provider",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "provider_admin" as const,
  roles: ["provider_admin" as const],
};
const shift = {
  id: "shift-1",
  careRequestId: "request-1",
  participantId: "participant-1",
  organisationId: "org-1",
  missionId: "mission-1",
  startAt: new Date("2026-07-20T09:00:00.000Z"),
  endAt: new Date("2026-07-20T11:00:00.000Z"),
};

describe("provider workforce operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.careShift.findUnique).mockResolvedValue(shift as never);
    vi.mocked(prisma.availabilityWindow.findFirst).mockResolvedValue({
      id: "window-1",
    } as never);
    vi.mocked(prisma.careShift.findFirst).mockResolvedValue(null);
  });

  it("creates an idempotent participant-controlled shift offer", async () => {
    vi.mocked(prisma.shiftOffer.upsert).mockResolvedValue({
      id: "offer-1",
      status: "awaiting_participant",
    } as never);
    const offer = await createShiftOffer({
      actor,
      careShiftId: shift.id,
      workerProfileId: "worker-1",
      idempotencyKey: "ad4c6c1c-62b3-4a9f-ac92-04c630d39e31",
      requiredCredentialTypes: ["wwcc"],
      expiresAt: new Date("2026-07-19T00:00:00.000Z"),
    });
    expect(offer.status).toBe("awaiting_participant");
    expect(prisma.shiftOffer.upsert).toHaveBeenCalledTimes(1);
  });

  it("requires participant ownership to confirm an offer", async () => {
    vi.mocked(prisma.shiftOffer.updateMany).mockResolvedValue({ count: 0 });
    await expect(
      participantConfirmShiftOffer({
        offerId: "offer-1",
        participantId: "wrong-participant",
      }),
    ).rejects.toThrow("SHIFT_OFFER_CONFIRMATION_INVALID");
  });

  it("prevents duplicate worker acceptance", async () => {
    vi.mocked(prisma.shiftOffer.findFirst).mockResolvedValue(null);
    await expect(
      workerAcceptShiftOffer({
        offerId: "offer-1",
        workerUserId: "worker-user-1",
      }),
    ).rejects.toThrow("SHIFT_OFFER_ACCEPTANCE_INVALID");
  });
});
