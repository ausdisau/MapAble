import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createSessionMock = vi.hoisted(() => vi.fn());
const receiptCreateMock = vi.hoisted(() => vi.fn());
const auditMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    breakGlassAccessSession: {
      create: createSessionMock,
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    participantAccessReceipt: {
      create: receiptCreateMock,
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: auditMock,
}));

import type { CurrentUser } from "@/lib/auth/current-user";
import {
  __resetBreakGlassSessionsForTests,
  BreakGlassRequiredError,
} from "@/lib/security/break-glass";
import { openHardenedBreakGlassSession } from "@/lib/trust-fabric/break-glass";

const admin: CurrentUser = {
  id: "admin-1",
  email: "admin@test.com",
  name: "Admin",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "mapable_admin",
  roles: ["mapable_admin"],
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.MAPABLE_TRUST_FABRIC_ENABLED = "true";
  createSessionMock.mockResolvedValue({});
  receiptCreateMock.mockResolvedValue({ id: "r1", correlationId: "c1" });
  auditMock.mockResolvedValue(undefined);
});

afterEach(() => {
  __resetBreakGlassSessionsForTests();
  delete process.env.MAPABLE_TRUST_FABRIC_ENABLED;
});

describe("hardened break-glass", () => {
  it("requires field categories", async () => {
    await expect(
      openHardenedBreakGlassSession({
        admin,
        purpose: "tenant_read",
        reason: "Investigating billing IDOR report",
        organisationId: "org-a",
        fieldCategories: [],
      }),
    ).rejects.toBeInstanceOf(BreakGlassRequiredError);
  });

  it("requires participant for participant_support", async () => {
    await expect(
      openHardenedBreakGlassSession({
        admin,
        purpose: "participant_support",
        reason: "Participant asked for urgent support review",
        fieldCategories: ["communication_preferences"],
      }),
    ).rejects.toBeInstanceOf(BreakGlassRequiredError);
  });

  it("persists session and receipt when trust fabric enabled", async () => {
    const session = await openHardenedBreakGlassSession({
      admin,
      purpose: "participant_support",
      reason: "Participant asked for urgent support review",
      participantId: "taylor-1",
      organisationId: "org-a",
      fieldCategories: ["communication_preferences", "active_authority"],
      ttlMinutes: 30,
    });

    expect(session.afterActionRequired).toBe(true);
    expect(session.correlationId).toBeTruthy();
    expect(createSessionMock).toHaveBeenCalled();
    expect(receiptCreateMock).toHaveBeenCalled();
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "trust_fabric.break_glass.opened",
      }),
    );
  });
});
