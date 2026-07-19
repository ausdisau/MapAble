import { describe, expect, it, vi, beforeEach } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import { validateClaimLinesForBatch } from "@/lib/ndis/claiming/validation";
import {
  assertParticipantLinkedToProvider,
  ParticipantProviderAccessError,
} from "@/lib/ndis/participant-provider-relationship-service";
import {
  assertCanAccessSuggestionSource,
  SuggestionSourceAccessError,
} from "@/lib/ndis/suggestion-source-access";

vi.mock("@/lib/api/phase3-scope", () => ({
  getUserOrganisationIds: vi.fn().mockResolvedValue(["org-allowed"]),
}));

const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    participantProviderRelationship: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    booking: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    careShift: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    careBooking: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    workerProfile: {
      findUnique: vi.fn().mockResolvedValue({ userId: "worker-user" }),
    },
    ndisClaimLine: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

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

describe("participant-provider relationship checks", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
  });

  it("requires an existing relationship", async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(
      assertParticipantLinkedToProvider("participant-1", "org-allowed")
    ).rejects.toThrow(ParticipantProviderAccessError);
  });

  it("requires active status when requested", async () => {
    mockFindUnique.mockResolvedValue({
      participantId: "participant-1",
      providerOrgId: "org-allowed",
      status: "pending_verification",
    });
    await expect(
      assertParticipantLinkedToProvider("participant-1", "org-allowed", {
        requireActive: true,
      })
    ).rejects.toMatchObject({ code: "NOT_ACTIVE" });
  });
});

describe("claim batch org validation", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("rejects lines from another provider org", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "line-1",
        providerOrgId: "org-other",
        status: "validated",
        paymentRoute: "ndia_managed",
        batchId: null,
      },
    ]);

    const result = await validateClaimLinesForBatch(
      ["line-1"],
      "ndia_managed",
      "org-allowed"
    );

    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === "provider_org_mismatch")).toBe(
      true
    );
  });
});

describe("suggestion source access", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
  });

  it("allows participant to access own booking source", async () => {
    mockFindUnique.mockResolvedValue({
      id: "booking-1",
      participantId: "participant-1",
      assignedOrganisationId: "org-allowed",
    });

    await expect(
      assertCanAccessSuggestionSource(participant, "booking", "booking-1")
    ).resolves.toMatchObject({ id: "booking-1" });
  });

  it("denies unrelated participant on booking source", async () => {
    mockFindUnique.mockResolvedValue({
      id: "booking-1",
      participantId: "participant-1",
      assignedOrganisationId: null,
    });

    await expect(
      assertCanAccessSuggestionSource(
        { ...participant, id: "participant-2" },
        "booking",
        "booking-1"
      )
    ).rejects.toThrow(SuggestionSourceAccessError);
  });

  it("rejects unsupported source types", async () => {
    await expect(
      assertCanAccessSuggestionSource(providerAdmin, "invoice", "inv-1")
    ).rejects.toMatchObject({ code: "UNSUPPORTED" });
  });
});
