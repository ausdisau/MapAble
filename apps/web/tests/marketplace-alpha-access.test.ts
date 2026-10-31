import { describe, expect, it } from "vitest";

import {
  alphaGateFromEnvironment,
  canAccessMarketplaceAlpha,
} from "../lib/marketplace/alpha-access";
import { isUnsafeMarketplaceInvoice } from "../packages/marketplace-inclusive/src/index";

const admin = { id: "admin-1", primaryRole: "mapable_admin" };
const tester = { id: "participant-1", primaryRole: "participant" };
const unlisted = { id: "participant-2", primaryRole: "participant" };

describe("Canonical Marketplace alpha isolation", () => {
  it("is off by default even for administrators", () => {
    const gate = alphaGateFromEnvironment({});
    expect(gate.enabled).toBe(false);
    expect(canAccessMarketplaceAlpha(admin, gate)).toBe(false);
  });
  it("requires feature switch plus authenticated admin or explicit tester", () => {
    const gate = alphaGateFromEnvironment({
      MAPABLE_MARKETPLACE_ALPHA_ENABLED: "true",
      MAPABLE_MARKETPLACE_ALPHA_TESTER_IDS: "participant-1, ",
    });
    expect(canAccessMarketplaceAlpha(admin, gate)).toBe(true);
    expect(canAccessMarketplaceAlpha(tester, gate)).toBe(true);
    expect(canAccessMarketplaceAlpha(unlisted, gate)).toBe(false);
    expect(canAccessMarketplaceAlpha(null, gate)).toBe(false);
  });
  it("will not treat a simulated supporter role as real authority", () => {
    const gate = alphaGateFromEnvironment({ MAPABLE_MARKETPLACE_ALPHA_ENABLED: "true" });
    expect(canAccessMarketplaceAlpha({id:"helper-1",primaryRole:"support_coordinator"}, gate)).toBe(false);
  });
  it("rejects client-priced Marketplace invoice source markers", () => {
    expect(isUnsafeMarketplaceInvoice({ serviceType: "marketplace", lineItems: [] })).toBe(true);
    expect(isUnsafeMarketplaceInvoice({ serviceType: "other", lineItems: [{ metadata: {productId:"mp_reacher"} }] })).toBe(true);
    expect(isUnsafeMarketplaceInvoice({ serviceType: "other", lineItems: [{ metadata: {marketplaceItemId:"demo-jar"} }] })).toBe(true);
    expect(isUnsafeMarketplaceInvoice({ serviceType: "care", lineItems: [{ metadata: {careShiftId:"synthetic"} }] })).toBe(false);
  });
});
