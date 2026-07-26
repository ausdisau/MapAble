import { describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import {
  assertCanMutateCareShift,
  assertCanViewCareShift,
  CareAccessError,
} from "@/lib/care/access-control";
import {
  canUserAccessSubmission,
  canUserSubmitForParticipant,
} from "@/lib/engagement/engagement-access";
import {
  assertCanAccessParticipantData,
  ParticipantAccessError,
} from "@/lib/prms/participant-access";
import { canUserAccessIncident } from "@/lib/safety/incident-access";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { assertCanAccessTransportBooking } from "@/lib/transport/transport-booking-access";

vi.mock("@/lib/api/organisation-scope", () => ({
  getUserOrganisationIds: vi.fn().mockResolvedValue(["org-allowed"]),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workerProfile: {
      findUnique: vi.fn().mockResolvedValue({ userId: "worker-user" }),
      findFirst: vi.fn().mockResolvedValue({ id: "driver-1" }),
    },
    driverProfile: {
      findFirst: vi.fn().mockResolvedValue({ id: "driver-1" }),
    },
  },
}));

const checkConsentMock = vi.fn().mockResolvedValue(false);

vi.mock("@/lib/consent/consent-service", () => ({
  checkConsent: (...args: unknown[]) => checkConsentMock(...args),
}));

const participant: CurrentUser = {
  id: "participant-1",
  email: "p@test.com",
  name: "Participant",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "participant",
  roles: ["participant"],
};

const otherParticipant: CurrentUser = {
  ...participant,
  id: "participant-2",
};

const providerAdmin: CurrentUser = {
  id: "provider-1",
  email: "prov@test.com",
  name: "Provider",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "provider_admin",
  roles: ["provider_admin"],
};

const worker: CurrentUser = {
  id: "worker-user",
  email: "w@test.com",
  name: "Worker",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "support_worker",
  roles: ["support_worker"],
};

const shift = {
  participantId: "participant-1",
  organisationId: "org-allowed",
  workerProfileId: "worker-profile-1",
};

describe("care shift access control", () => {
  it("allows participant to view own shift", async () => {
    await expect(assertCanViewCareShift(participant, shift)).resolves.toBeUndefined();
  });

  it("denies other participant from viewing shift", async () => {
    await expect(assertCanViewCareShift(otherParticipant, shift)).rejects.toThrow(
      CareAccessError
    );
  });

  it("allows provider admin for org shift", async () => {
    await expect(assertCanViewCareShift(providerAdmin, shift)).resolves.toBeUndefined();
  });

  it("allows assigned worker to mutate shift", async () => {
    await expect(assertCanMutateCareShift(worker, shift)).resolves.toBeUndefined();
  });

  it("denies participant from mutating shift", async () => {
    await expect(assertCanMutateCareShift(participant, shift)).rejects.toThrow(
      CareAccessError
    );
  });
});

describe("transport booking access control", () => {
  const booking = {
    participantId: "participant-1",
    operatorOrganisationId: "org-allowed",
    driverProfileId: "driver-1",
  };

  it("allows participant to access own booking", async () => {
    await expect(
      assertCanAccessTransportBooking(participant, booking)
    ).resolves.toBeUndefined();
  });

  it("denies unrelated participant", async () => {
    await expect(
      assertCanAccessTransportBooking(otherParticipant, {
        ...booking,
        operatorOrganisationId: "org-other",
        driverProfileId: null,
      })
    ).rejects.toThrow(TransportApiError);
  });

  it("allows provider org member", async () => {
    await expect(
      assertCanAccessTransportBooking(providerAdmin, booking)
    ).resolves.toBeUndefined();
  });
});

describe("participant data access control", () => {
  it("allows participant self access", async () => {
    await expect(
      assertCanAccessParticipantData(participant, "participant-1")
    ).resolves.toBeUndefined();
  });

  it("denies cross-participant access without consent", async () => {
    await expect(
      assertCanAccessParticipantData(otherParticipant, "participant-1")
    ).rejects.toThrow(ParticipantAccessError);
  });
});

describe("engagement delegate boundaries", () => {
  const submission = {
    participantId: "participant-1",
    submittedById: "participant-1",
  };

  it("allows participant to access own submission", async () => {
    expect(
      await canUserAccessSubmission(submission, "participant-1", "participant")
    ).toBe(true);
  });

  it("denies unrelated participant", async () => {
    expect(
      await canUserAccessSubmission(submission, "participant-2", "participant")
    ).toBe(false);
  });

  it("denies family member without delegate consent", async () => {
    checkConsentMock.mockResolvedValueOnce(false);
    expect(
      await canUserAccessSubmission(
        submission,
        "family-1",
        "family_member",
        "participant-1"
      )
    ).toBe(false);
  });

  it("allows family member with read delegate consent", async () => {
    checkConsentMock.mockResolvedValueOnce(true);
    expect(
      await canUserAccessSubmission(
        submission,
        "family-1",
        "family_member",
        "participant-1"
      )
    ).toBe(true);
  });

  it("denies submit without delegate submit consent", async () => {
    checkConsentMock.mockResolvedValue(false);
    const result = await canUserSubmitForParticipant(
      "participant-1",
      "family-1",
      "family_member"
    );
    expect(result.allowed).toBe(false);
  });
});

describe("incident access control", () => {
  it("allows participant linked to incident", () => {
    expect(
      canUserAccessIncident(
        { participantId: "participant-1", reportedById: "other" },
        "participant-1",
        false
      )
    ).toBe(true);
  });

  it("denies unrelated user", () => {
    expect(
      canUserAccessIncident(
        { participantId: "participant-1", reportedById: "reporter-1" },
        "stranger",
        false
      )
    ).toBe(false);
  });
});
