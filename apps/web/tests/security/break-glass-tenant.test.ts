import { afterEach, describe, expect, it } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import {
  __resetBreakGlassSessionsForTests,
  assertAdminTenantAccess,
  BreakGlassRequiredError,
  openBreakGlassSession,
} from "@/lib/security/break-glass";

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

afterEach(() => {
  __resetBreakGlassSessionsForTests();
  delete process.env.MAPABLE_REQUIRE_ADMIN_BREAK_GLASS;
});

describe("admin break-glass tenant access", () => {
  it("blocks ambient admin org access when break-glass required", () => {
    process.env.MAPABLE_REQUIRE_ADMIN_BREAK_GLASS = "true";
    expect(() => assertAdminTenantAccess(admin, "org-a")).toThrow(
      BreakGlassRequiredError,
    );
  });

  it("allows admin after opening scoped break-glass", () => {
    process.env.MAPABLE_REQUIRE_ADMIN_BREAK_GLASS = "true";
    openBreakGlassSession({
      admin,
      purpose: "tenant_read",
      reason: "Investigating billing IDOR report",
      organisationId: "org-a",
      ttlMinutes: 30,
    });
    expect(() => assertAdminTenantAccess(admin, "org-a")).not.toThrow();
    expect(() => assertAdminTenantAccess(admin, "org-b")).toThrow(
      BreakGlassRequiredError,
    );
  });
});
