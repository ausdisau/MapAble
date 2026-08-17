import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  OrganisationAccessError,
  assertOrganisationAccess,
  organisationScopedIds,
} from "@/lib/api/organisation-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import {
  createAvailabilityBodySchema,
  createDriverBodySchema,
  createVehicleBodySchema,
} from "@/lib/validation/org-transport";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organisationMember: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const memberUser = {
  id: "user-member",
  primaryRole: "transport_operator",
} as CurrentUser;

const outsider = {
  id: "user-outsider",
  primaryRole: "transport_operator",
} as CurrentUser;

beforeEach(() => {
  vi.mocked(prisma.organisationMember.findMany).mockReset();
  process.env.MAPABLE_REQUIRE_ADMIN_BREAK_GLASS = "false";
});

describe("org-scoped transport mutations", () => {
  it("rejects unknown fields on driver/vehicle/availability bodies", () => {
    expect(
      createDriverBodySchema.safeParse({
        userId: "u1",
        organisationId: "org-a",
        displayName: "Driver",
        extra: true,
      }).success,
    ).toBe(false);
    expect(
      createVehicleBodySchema.safeParse({
        organisationId: "org-a",
        displayName: "Van",
        vehicleType: "standard_car",
        injected: "x",
      }).success,
    ).toBe(false);
    expect(
      createAvailabilityBodySchema.safeParse({
        organisationId: "org-a",
        dayOfWeek: "MONDAY",
        startTime: "09:00",
        endTime: "17:00",
        role: "admin",
      }).success,
    ).toBe(false);
  });

  it("allows organisation members and denies cross-tenant organisationId", async () => {
    vi.mocked(prisma.organisationMember.findMany).mockImplementation(((
      args?: { where?: { userId?: string } },
    ) => {
      const userId = args?.where?.userId;
      const organisationId =
        userId === "user-member" ? "org-a" : "org-b";
      return Promise.resolve([{ organisationId }]);
    }) as unknown as typeof prisma.organisationMember.findMany);

    await expect(
      assertOrganisationAccess(memberUser, "org-a", "driver:manage:org"),
    ).resolves.toBeUndefined();

    await expect(
      assertOrganisationAccess(outsider, "org-a", "driver:manage:org"),
    ).rejects.toBeInstanceOf(OrganisationAccessError);

    await expect(
      assertOrganisationAccess(memberUser, "org-a", "vehicle:manage:org"),
    ).resolves.toBeUndefined();

    await expect(
      assertOrganisationAccess(outsider, "org-a", "availability:manage:org"),
    ).rejects.toBeInstanceOf(OrganisationAccessError);
  });

  it("scopes list organisation ids to membership", async () => {
    vi.mocked(prisma.organisationMember.findMany).mockResolvedValue([
      { organisationId: "org-a" },
      { organisationId: "org-c" },
    ] as Awaited<ReturnType<typeof prisma.organisationMember.findMany>>);
    const scope = await organisationScopedIds(memberUser, "driver:manage:org");
    expect(scope).toEqual(["org-a", "org-c"]);
  });
});
