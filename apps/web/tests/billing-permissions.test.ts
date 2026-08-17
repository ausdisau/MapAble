import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import {
  canAccessBillingCentre,
  hasBillingPermission,
  listBillingPermissions,
} from "@/lib/billing/permissions";

describe("billing RBAC", () => {
  it("gives participants view_own and approve_participant", () => {
    expect(hasBillingPermission("participant", "billing:view_own")).toBe(true);
    expect(
      hasBillingPermission("participant", "billing:approve_participant")
    ).toBe(true);
    expect(hasBillingPermission("participant", "billing:manage_policy")).toBe(
      false
    );
  });

  it("gives family_member delegated view", () => {
    expect(hasBillingPermission("family_member", "billing:view_delegated")).toBe(
      true
    );
  });

  it("gives support_coordinator read-only delegated access", () => {
    expect(
      hasBillingPermission("support_coordinator", "billing:view_delegated")
    ).toBe(true);
    expect(
      hasBillingPermission("support_coordinator", "billing:approve_participant")
    ).toBe(false);
  });

  it("gives provider_admin draft and issue permissions", () => {
    const perms = listBillingPermissions("provider_admin");
    expect(perms).toContain("billing:create_draft");
    expect(perms).toContain("billing:issue_invoice");
    expect(perms).not.toContain("billing:manage_policy");
  });

  it("mapable_admin has full billing permissions via admin short-circuit", () => {
    expect(hasPermission("mapable_admin", "billing:manage_integrations")).toBe(
      true
    );
    expect(canAccessBillingCentre("mapable_admin")).toBe(true);
  });

  it("allows centre access for invoice readers", () => {
    expect(canAccessBillingCentre("participant")).toBe(true);
    expect(canAccessBillingCentre("driver")).toBe(false);
  });
});
