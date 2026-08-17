import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/phase3-scope", () => ({
  getUserOrganisationIds: vi.fn().mockResolvedValue([]),
}));

import type { CurrentUser } from "@/lib/auth/current-user";
import {
  canViewSensitiveBookingFields,
  buildBookingRAGScope,
} from "@/lib/bookings/rag/scope";

function makeUser(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: "user-participant",
    email: "participant@example.com",
    name: "Test Participant",
    phone: null,
    timezone: "Australia/Sydney",
    locale: "en-AU",
    primaryRole: "participant",
    roles: ["participant"],
    ...overrides,
  };
}

describe("booking RAG scope", () => {
  it("scopes participants to their own bookings", async () => {
    const user = makeUser();
    const scope = await buildBookingRAGScope(user);

    expect(scope.isAdmin).toBe(false);
    expect(scope.participantId).toBe("user-participant");
    expect(scope.organisationIds).toBeUndefined();
  });

  it("allows participant to view sensitive fields on own booking", () => {
    const scope = {
      isAdmin: false,
      participantId: "user-participant",
      viewerUserId: "user-participant",
      viewerRole: "participant",
    };

    expect(
      canViewSensitiveBookingFields(scope, {
        participantId: "user-participant",
        organisationId: "org-1",
      }),
    ).toBe(true);
  });

  it("denies sensitive fields for unrelated participant", () => {
    const scope = {
      isAdmin: false,
      participantId: "user-a",
      viewerUserId: "user-a",
      viewerRole: "participant",
    };

    expect(
      canViewSensitiveBookingFields(scope, {
        participantId: "user-b",
        organisationId: "org-1",
      }),
    ).toBe(false);
  });

  it("allows provider org members to view sensitive fields for org bookings", () => {
    const scope = {
      isAdmin: false,
      organisationIds: ["org-1", "org-2"],
      viewerUserId: "provider-admin",
      viewerRole: "provider_admin",
    };

    expect(
      canViewSensitiveBookingFields(scope, {
        participantId: "other-participant",
        organisationId: "org-1",
      }),
    ).toBe(true);

    expect(
      canViewSensitiveBookingFields(scope, {
        participantId: "other-participant",
        organisationId: "org-99",
      }),
    ).toBe(false);
  });

  it("grants admin unrestricted sensitive access", () => {
    const scope = {
      isAdmin: true,
      viewerUserId: "admin-1",
      viewerRole: "platform_admin",
    };

    expect(
      canViewSensitiveBookingFields(scope, {
        participantId: "anyone",
        organisationId: null,
      }),
    ).toBe(true);
  });
});
