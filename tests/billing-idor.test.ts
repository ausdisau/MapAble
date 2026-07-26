import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";

const getUserOrganisationIds = vi.fn();
const findUniqueInvoice = vi.fn();
const findUniquePayout = vi.fn();

vi.mock("@/lib/api/organisation-scope", () => ({
  getUserOrganisationIds: (...args: unknown[]) =>
    getUserOrganisationIds(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    billingInvoice: {
      findUnique: (...args: unknown[]) => findUniqueInvoice(...args),
    },
    billingCentreProviderPayout: {
      findUnique: (...args: unknown[]) => findUniquePayout(...args),
    },
  },
}));

import {
  BillingAccessError,
  assertCanManageBillingOrganisation,
  assertCanViewBillingInvoice,
} from "@/lib/billing/access";

const participantA: CurrentUser = {
  id: "user-a",
  email: "a@test.com",
  name: "Participant A",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "participant",
  roles: ["participant"],
};

const participantB: CurrentUser = {
  ...participantA,
  id: "user-b",
  email: "b@test.com",
  name: "Participant B",
};

const providerOrgA: CurrentUser = {
  id: "prov-a",
  email: "pa@test.com",
  name: "Provider A",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "provider_admin",
  roles: ["provider_admin"],
};

const providerOrgB: CurrentUser = {
  ...providerOrgA,
  id: "prov-b",
  email: "pb@test.com",
  name: "Provider B",
};

describe("billing tenant / IDOR isolation", () => {
  beforeEach(() => {
    getUserOrganisationIds.mockReset();
    findUniqueInvoice.mockReset();
    findUniquePayout.mockReset();
  });

  it("blocks participant B from viewing participant A invoice", async () => {
    findUniqueInvoice.mockResolvedValue({
      id: "inv-1",
      userId: "user-a",
      providerId: "org-a",
    });

    await expect(
      assertCanViewBillingInvoice(participantB, "inv-1")
    ).rejects.toMatchObject({
      name: "BillingAccessError",
      status: 404,
    });
  });

  it("allows participant A to view own invoice", async () => {
    findUniqueInvoice.mockResolvedValue({
      id: "inv-1",
      userId: "user-a",
      providerId: "org-a",
    });

    const invoice = await assertCanViewBillingInvoice(participantA, "inv-1");
    expect(invoice.id).toBe("inv-1");
  });

  it("blocks provider in org B from org A invoice", async () => {
    findUniqueInvoice.mockResolvedValue({
      id: "inv-1",
      userId: "user-a",
      providerId: "org-a",
    });
    getUserOrganisationIds.mockResolvedValue(["org-b"]);

    await expect(
      assertCanViewBillingInvoice(providerOrgB, "inv-1")
    ).rejects.toBeInstanceOf(BillingAccessError);
  });

  it("allows provider in org A to view org A invoice", async () => {
    findUniqueInvoice.mockResolvedValue({
      id: "inv-1",
      userId: "user-a",
      providerId: "org-a",
    });
    getUserOrganisationIds.mockResolvedValue(["org-a"]);

    const invoice = await assertCanViewBillingInvoice(providerOrgA, "inv-1");
    expect(invoice.providerId).toBe("org-a");
  });

  it("blocks cross-tenant payout manage access", async () => {
    getUserOrganisationIds.mockResolvedValue(["org-b"]);
    await expect(
      assertCanManageBillingOrganisation(providerOrgB, "org-a")
    ).rejects.toMatchObject({ status: 403 });
  });

  it("allows same-tenant payout manage access for provider_admin", async () => {
    getUserOrganisationIds.mockResolvedValue(["org-a"]);
    await expect(
      assertCanManageBillingOrganisation(providerOrgA, "org-a")
    ).resolves.toBeUndefined();
  });
});
