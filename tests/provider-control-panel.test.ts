import { beforeEach, describe, expect, it, vi } from "vitest";

import { defaultDashboardPath } from "@/lib/auth/roles";
import { PROVIDER_NAV_LINKS } from "@/lib/platform/core-ui/provider-nav";
import { getProviderControlPanelSummary } from "@/lib/provider/provider-control-panel-service";

vi.mock("@/lib/onboarding/onboarding-evaluator", () => ({
  evaluateProviderOnboarding: vi.fn(),
}));

vi.mock("@/lib/onboarding/provider-service-ready", () => ({
  evaluateProviderServiceReady: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organisationMember: {
      findMany: vi.fn(),
    },
    workerProfile: {
      count: vi.fn(),
    },
    workerOrganisationInvite: {
      count: vi.fn(),
    },
    booking: {
      count: vi.fn(),
    },
    careRequest: {
      count: vi.fn(),
    },
    careShift: {
      count: vi.fn(),
    },
    providerOnboardingTask: {
      findFirst: vi.fn(),
    },
  },
}));

import { evaluateProviderOnboarding } from "@/lib/onboarding/onboarding-evaluator";
import { evaluateProviderServiceReady } from "@/lib/onboarding/provider-service-ready";
import { prisma } from "@/lib/prisma";

describe("provider control panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defaultDashboardPath for provider_admin returns /provider", () => {
    expect(defaultDashboardPath("provider_admin")).toBe("/provider");
    expect(defaultDashboardPath("transport_operator")).toBe("/provider");
  });

  it("provider nav uses consolidated section hubs", () => {
    expect(
      PROVIDER_NAV_LINKS.some((l) => l.href === "/enterprise-provider")
    ).toBe(false);
    expect(PROVIDER_NAV_LINKS.some((l) => l.href === "/provider")).toBe(true);
    expect(PROVIDER_NAV_LINKS.some((l) => l.href === "/provider/claiming")).toBe(
      true
    );
    expect(PROVIDER_NAV_LINKS.some((l) => l.href === "/provider/insights")).toBe(
      true
    );
    expect(
      PROVIDER_NAV_LINKS.some((l) => l.href === "/provider/messages")
    ).toBe(false);
    expect(
      PROVIDER_NAV_LINKS.some((l) => l.href === "/provider/care/requests")
    ).toBe(false);
    const controlPanel = PROVIDER_NAV_LINKS.find((l) => l.href === "/provider");
    expect(controlPanel?.match).toBe("exact");
  });

  it("returns empty summary when user has no organisation memberships", async () => {
    vi.mocked(prisma.organisationMember.findMany).mockResolvedValue([]);

    const summary = await getProviderControlPanelSummary("user-no-org");

    expect(summary.organisations).toEqual([]);
    expect(summary.primaryOrganisation).toBeNull();
  });

  it("aggregates org-scoped metrics for memberships", async () => {
    vi.mocked(prisma.organisationMember.findMany).mockResolvedValue([
      {
        organisationId: "org-1",
        organisation: { id: "org-1", name: "Care Co" },
      },
    ] as never);

    vi.mocked(prisma.workerProfile.count)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2);
    vi.mocked(prisma.workerOrganisationInvite.count).mockResolvedValue(3);
    vi.mocked(prisma.booking.count).mockResolvedValue(4);
    vi.mocked(prisma.careRequest.count).mockResolvedValue(6);
    vi.mocked(prisma.careShift.count)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(1);
    vi.mocked(evaluateProviderOnboarding).mockResolvedValue({
      role: "provider",
      profileCompletenessScore: 60,
      readyToMatch: false,
      checklist: [
        { id: "a", label: "A", complete: false, blocker: true },
        { id: "b", label: "B", complete: true, blocker: true },
      ],
    });
    vi.mocked(evaluateProviderServiceReady).mockResolvedValue({
      role: "provider",
      profileCompletenessScore: 60,
      readyToMatch: false,
      serviceReady: false,
      checklist: [
        { id: "a", label: "A", complete: false, blocker: true },
        { id: "b", label: "B", complete: true, blocker: true },
        {
          id: "verified_workers",
          label: "At least one verified support worker",
          complete: false,
          blocker: true,
        },
      ],
    });
    vi.mocked(prisma.providerOnboardingTask.findFirst).mockResolvedValue({
      status: "pending",
    } as never);

    const summary = await getProviderControlPanelSummary("admin-1");

    expect(summary.primaryOrganisation).toMatchObject({
      organisationId: "org-1",
      organisationName: "Care Co",
      activeWorkers: 5,
      pendingVerificationWorkers: 2,
      pendingInvites: 3,
      assignedBookings: 4,
      openCareRequests: 6,
      upcomingShifts7d: 7,
      unassignedShifts72h: 1,
      onboardingReady: false,
      onboardingBlockerCount: 1,
      onboardingCompletenessScore: 60,
      serviceReady: false,
      serviceReadyBlockerCount: 2,
      workersTaskStatus: "pending",
    });
  });
});
