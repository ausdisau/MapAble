import { describe, expect, it } from "vitest";

import { HIGH_RISK_ROUTES } from "@/lib/security/high-risk-routes";
import { dataVaultRequestSchema } from "@/lib/validation/data-vault";
import { microConsentPostSchema } from "@/lib/validation/micro-consent";

describe("high-risk route Zod schemas", () => {
  it("rejects unknown fields on micro-consent grant", () => {
    const result = microConsentPostSchema.safeParse({
      microAction: "support_profile.share_worker",
      evil: true,
    });
    expect(result.success).toBe(false);
  });

  it("accepts revoke and grant shapes", () => {
    expect(
      microConsentPostSchema.safeParse({
        action: "revoke",
        consentId: "c1",
      }).success,
    ).toBe(true);
    expect(
      microConsentPostSchema.safeParse({
        microAction: "orchestration.share_transport",
        purpose: "Share transport needs for trip",
      }).success,
    ).toBe(true);
  });

  it("rejects unknown data-vault fields and invalid types", () => {
    expect(
      dataVaultRequestSchema.safeParse({ requestType: "export", x: 1 }).success,
    ).toBe(false);
    expect(
      dataVaultRequestSchema.safeParse({ requestType: "delete" }).success,
    ).toBe(false);
    expect(
      dataVaultRequestSchema.safeParse({ requestType: "portability" }).success,
    ).toBe(true);
  });

  it("inventories billing overview as tenant-assert required", () => {
    const overview = HIGH_RISK_ROUTES.find(
      (r) => r.path === "/api/billing/overview",
    );
    expect(overview?.tenantAssertRequired).toBe(true);
  });
});
