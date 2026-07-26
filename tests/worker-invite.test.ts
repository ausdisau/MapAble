import { beforeEach, describe, expect, it, vi } from "vitest";

import { workersListWhere } from "@/lib/api/organisation-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import {
  buildWorkerInviteUrl,
  maskEmail,
} from "@/lib/workers/worker-invite-service";

const providerAdmin: CurrentUser = {
  id: "admin1",
  email: "admin@test.com",
  name: "Admin",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "provider_admin",
  roles: ["provider_admin"],
};

const workerUser: CurrentUser = {
  id: "wuser1",
  email: "worker@test.com",
  name: "Worker",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "support_worker",
  roles: ["support_worker"],
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organisationMember: {
      findMany: vi.fn(),
    },
    workerProfile: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    workerOrganisationInvite: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userRoleAssignment: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn({})),
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/onboarding/onboarding-service", () => ({
  refreshWorkerOnboarding: vi.fn(),
}));

vi.mock("@/lib/provider-onboarding-automation/onboarding-service", () => ({
  syncWorkersOnboardingTask: vi.fn(),
}));

describe("worker invite helpers", () => {
  it("masks email for public invite metadata", () => {
    expect(maskEmail("jordan.worker@example.com")).toBe("jo***@example.com");
  });

  it("builds invite URL from app base", () => {
    const url = buildWorkerInviteUrl("abc123");
    expect(url).toContain("/invite/worker/abc123");
  });
});

describe("workersListWhere scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes support workers to own profiles", async () => {
    const where = await workersListWhere(workerUser);
    expect(where).toEqual({ userId: "wuser1" });
  });

  it("scopes provider admins to organisation memberships", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.organisationMember.findMany).mockResolvedValue([
      { organisationId: "org-a" },
      { organisationId: "org-b" },
    ] as never);

    const where = await workersListWhere(providerAdmin);
    expect(where).toEqual({ organisationId: { in: ["org-a", "org-b"] } });
  });
});

describe("inviteWorkerToOrganisation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects duplicate pending invite", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.organisationMember.findMany).mockResolvedValue([
      { organisationId: "org1" },
    ] as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.workerOrganisationInvite.findFirst).mockResolvedValue({
      id: "existing",
    } as never);

    const { inviteWorkerToOrganisation } = await import(
      "@/lib/workers/worker-invite-service"
    );

    await expect(
      inviteWorkerToOrganisation({
        organisationId: "org1",
        email: "new@worker.test",
        invitedBy: providerAdmin,
      })
    ).rejects.toThrow("INVITE_ALREADY_PENDING");
  });
});
