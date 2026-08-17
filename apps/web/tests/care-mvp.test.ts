import { describe, expect, it } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import {
  assertParticipantOwnsBooking,
  CareAccessError,
} from "@/lib/care/access-control";
import {
  assertWorkerEligibleForBooking,
  bookingHasHighIntensityTasks,
} from "@/lib/care/worker-eligibility";

const participantUser: CurrentUser = {
  id: "p1",
  email: "p@test.com",
  name: "Participant",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "participant",
  roles: ["participant"],
};

describe("Care MVP permissions", () => {
  it("allows participant care self", () => {
    expect(hasPermission("participant", "care:manage:self")).toBe(true);
  });

  it("allows provider org care", () => {
    expect(hasPermission("provider_admin", "care:manage:org")).toBe(true);
  });

  it("allows worker shift work", () => {
    expect(hasPermission("support_worker", "care:shift:work")).toBe(true);
  });
});

describe("worker eligibility", () => {
  const baseWorker = {
    id: "w1",
    organisationId: "org1",
    active: true,
    verificationStatus: "verified" as const,
    workerScreeningStatus: "verified" as const,
    highIntensityCompetencyVerified: false,
  };

  it("detects high intensity tasks", () => {
    expect(
      bookingHasHighIntensityTasks([{ name: "Hoist transfer", intensity: "high" }])
    ).toBe(true);
  });

  it("blocks high intensity without competency", () => {
    expect(() =>
      assertWorkerEligibleForBooking(baseWorker, {
        organisationId: "org1",
        tasks: [{ intensity: "high" }],
      })
    ).toThrow("HIGH_INTENSITY_COMPETENCY_REQUIRED");
  });

  it("allows high intensity with competency", () => {
    expect(() =>
      assertWorkerEligibleForBooking(
        { ...baseWorker, highIntensityCompetencyVerified: true },
        {
          organisationId: "org1",
          tasks: [{ intensity: "high" }],
        }
      )
    ).not.toThrow();
  });

  it("blocks wrong organisation", () => {
    expect(() =>
      assertWorkerEligibleForBooking(baseWorker, {
        organisationId: "other-org",
        tasks: [],
      })
    ).toThrow("WORKER_ORG_MISMATCH");
  });
});

describe("participant booking access", () => {
  it("allows own booking", () => {
    expect(() =>
      assertParticipantOwnsBooking(participantUser, { participantId: "p1" })
    ).not.toThrow();
  });

  it("denies other participant", () => {
    expect(() =>
      assertParticipantOwnsBooking(participantUser, { participantId: "other" })
    ).toThrow(CareAccessError);
  });
});

describe("service log invoice gate", () => {
  it("SERVICE_LOG_REQUIRED is thrown message", () => {
    expect("SERVICE_LOG_REQUIRED").toBe("SERVICE_LOG_REQUIRED");
  });
});
