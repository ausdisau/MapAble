import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/care-recurring", () => ({
  careRecurringConfig: { enabled: true },
  isCareRecurringSchedulesEnabled: () => true,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    careBooking: { findUnique: vi.fn() },
    careServiceAgreement: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    careRecurringSchedule: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    careRecurringScheduleException: { create: vi.fn() },
    careShift: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    careShiftCancellation: { create: vi.fn() },
    careRequest: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/calendar/calendar-service", () => ({
  syncCalendarForCareShift: vi.fn(async () => undefined),
}));

vi.mock("@/lib/care/access-control", () => ({
  CareAccessError: class CareAccessError extends Error {},
  assertProviderOrgAccess: vi.fn(async () => undefined),
  assertParticipantOwnsBooking: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  amendAccessibleServiceAgreement,
  acceptAccessibleServiceAgreement,
  getOrCreateAccessibleServiceAgreement,
} from "@/lib/care/care-agreement-service";
import {
  activateCareRecurringSchedule,
  cancelCareShiftWithRecoveryHook,
  createCareRecurringSchedule,
} from "@/lib/care/care-recurring-schedule-service";
import type { CurrentUser } from "@/lib/auth/current-user";

const participant = {
  id: "taylor",
  primaryRole: "participant",
} as CurrentUser;

const provider = {
  id: "provider-1",
  primaryRole: "provider_admin",
} as CurrentUser;

describe("care agreement completion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates, accepts, and amends with version bump requiring re-acceptance", async () => {
    const agreementRow = {
      id: "agr-1",
      careBookingId: "booking-1",
      placeholderTitle: "Accessible service agreement",
      placeholderSummary: null as string | null,
      status: "placeholder",
    };

    let created = false;
    vi.mocked(prisma.careBooking.findUnique).mockImplementation((async () => {
      return {
        id: "booking-1",
        participantId: "taylor",
        organisationId: "org-a",
        serviceAgreement: created ? { ...agreementRow } : null,
      };
    }) as unknown as typeof prisma.careBooking.findUnique);

    vi.mocked(prisma.careServiceAgreement.create).mockImplementation((async ({
      data,
    }: {
      data: Record<string, unknown>;
    }) => {
      agreementRow.placeholderSummary = data.placeholderSummary as string;
      agreementRow.status = data.status as string;
      created = true;
      return { ...agreementRow };
    }) as unknown as typeof prisma.careServiceAgreement.create);

    vi.mocked(prisma.careServiceAgreement.update).mockImplementation((async ({
      data,
    }: {
      data: Record<string, unknown>;
    }) => {
      if (data.placeholderSummary) {
        agreementRow.placeholderSummary = data.placeholderSummary as string;
      }
      if (data.status) agreementRow.status = data.status as string;
      return { ...agreementRow };
    }) as unknown as typeof prisma.careServiceAgreement.update);

    const proposed = await getOrCreateAccessibleServiceAgreement(
      "booking-1",
      participant,
    );
    expect(proposed.status).toBe("proposed");
    expect(proposed.version).toBe(1);

    const accepted = await acceptAccessibleServiceAgreement({
      careBookingId: "booking-1",
      actor: participant,
      acknowledgement: "I understand this agreement",
    });
    expect(accepted.status).toBe("accepted");
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "care_agreement.accepted" }),
    );

    const amended = await amendAccessibleServiceAgreement({
      careBookingId: "booking-1",
      actor: provider,
      reason: "Weekly schedule added for Starting Work supports",
    });
    expect(amended.version).toBe(2);
    expect(amended.status).toBe("proposed");
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "care_agreement.amended" }),
    );
  });
});

describe("care recurring schedules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates draft schedule and activates with agreement amend hook", async () => {
    vi.mocked(prisma.careBooking.findUnique).mockResolvedValue({
      id: "booking-1",
      participantId: "taylor",
      organisationId: "org-a",
      careRequestId: "req-1",
      location: "Harbour",
      serviceAgreement: {
        id: "agr-1",
        careBookingId: "booking-1",
        placeholderTitle: "Agreement",
        placeholderSummary: JSON.stringify({
          __mapableAgreement: true,
          version: 1,
          status: "accepted",
          formats: ["plain_language"],
          supportedDecisionMakingOffered: true,
          body: "Supports for Starting Work.",
        }),
        status: "accepted",
      },
    } as never);

    vi.mocked(prisma.careRecurringSchedule.create).mockResolvedValue({
      id: "sched-1",
      careBookingId: "booking-1",
      participantId: "taylor",
      organisationId: "org-a",
      frequency: "weekly",
      byWeekday: [1, 3],
      startTimeLocal: "09:00",
      endTimeLocal: "11:00",
      timezone: "Australia/Sydney",
      effectiveFrom: new Date("2026-07-20T00:00:00.000Z"),
      effectiveTo: null,
      status: "draft",
    } as never);

    const created = await createCareRecurringSchedule({
      careBookingId: "booking-1",
      actor: provider,
      frequency: "weekly",
      byWeekday: [1, 3],
      startTimeLocal: "09:00",
      endTimeLocal: "11:00",
      effectiveFrom: new Date("2026-07-20T00:00:00.000Z"),
    });
    expect(created.status).toBe("draft");
    expect(created.frequency).toBe("weekly");

    vi.mocked(prisma.careRecurringSchedule.findUnique).mockResolvedValue({
      id: "sched-1",
      careBookingId: "booking-1",
      participantId: "taylor",
      organisationId: "org-a",
      frequency: "weekly",
      byWeekday: [1, 3],
      startTimeLocal: "09:00",
      endTimeLocal: "11:00",
      timezone: "Australia/Sydney",
      effectiveFrom: new Date("2026-07-20T00:00:00.000Z"),
      effectiveTo: null,
      status: "draft",
      careBooking: {
        id: "booking-1",
        participantId: "taylor",
        organisationId: "org-a",
      },
    } as never);

    vi.mocked(prisma.careRecurringSchedule.update).mockResolvedValue({
      id: "sched-1",
      careBookingId: "booking-1",
      participantId: "taylor",
      organisationId: "org-a",
      frequency: "weekly",
      byWeekday: [1, 3],
      startTimeLocal: "09:00",
      endTimeLocal: "11:00",
      timezone: "Australia/Sydney",
      effectiveFrom: new Date("2026-07-20T00:00:00.000Z"),
      effectiveTo: null,
      status: "active",
    } as never);

    vi.mocked(prisma.careServiceAgreement.update).mockResolvedValue({
      id: "agr-1",
      status: "proposed",
    } as never);

    const activated = await activateCareRecurringSchedule({
      scheduleId: "sched-1",
      actor: provider,
      amendAgreement: true,
      agreementReason: "Weekly Mon/Wed supports activated",
    });
    expect(activated.status).toBe("active");
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "care_recurring_schedule.activated" }),
    );
  });

  it("cancels Care shift without auto-cancelling Transport", async () => {
    vi.mocked(prisma.careShift.findUnique).mockResolvedValue({
      id: "shift-1",
      participantId: "taylor",
      organisationId: "org-a",
      status: "scheduled",
    } as never);
    vi.mocked(prisma.careShiftCancellation.create).mockResolvedValue({
      id: "cancel-1",
      careShiftId: "shift-1",
      reason: "Worker unavailable",
      cancelledById: "provider-1",
    } as never);
    vi.mocked(prisma.careShift.update).mockResolvedValue({
      id: "shift-1",
      status: "cancelled",
    } as never);

    const result = await cancelCareShiftWithRecoveryHook({
      careShiftId: "shift-1",
      actor: provider,
      reason: "Worker unavailable",
    });
    expect(result.transportAutoCancelled).toBe(false);
    expect(result.recoveryHint).toMatch(/not auto-cancelled/i);
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "care_shift.cancelled",
        metadata: expect.objectContaining({ transportAutoCancelled: false }),
      }),
    );
  });
});
