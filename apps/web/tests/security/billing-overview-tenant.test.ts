import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import {
  assertCanAccessBillingOrganisation,
  BillingAccessError,
} from "@/lib/billing/access";

const getUserOrganisationIds = vi.fn();

vi.mock("@/lib/api/organisation-scope", () => ({
  getUserOrganisationIds: (...args: unknown[]) =>
    getUserOrganisationIds(...args),
}));

vi.mock("@/lib/security/break-glass", () => ({
  assertAdminTenantAccess: vi.fn(),
}));

const provider: CurrentUser = {
  id: "prov-1",
  email: "p@test.com",
  name: "Provider",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "provider_admin",
  roles: ["provider_admin"],
};

describe("billing overview tenant scope", () => {
  beforeEach(() => {
    getUserOrganisationIds.mockReset();
  });

  it("denies cross-organisation billing overview scope", async () => {
    getUserOrganisationIds.mockResolvedValue(["org-allowed"]);
    await expect(
      assertCanAccessBillingOrganisation(provider, "org-other"),
    ).rejects.toThrow(BillingAccessError);
  });

  it("allows member organisation", async () => {
    getUserOrganisationIds.mockResolvedValue(["org-allowed"]);
    await expect(
      assertCanAccessBillingOrganisation(provider, "org-allowed"),
    ).resolves.toBeUndefined();
  });
});
