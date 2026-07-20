import { afterEach, describe, expect, it } from "vitest";

import { companionConfig, isCompanionEnabled } from "@/lib/config/companion";

describe("Companion config fail-closed defaults", () => {
  afterEach(() => {
    delete process.env.MAPABLE_COMPANION_ENABLED;
    delete process.env.MAPABLE_COMPANION_VISIT_PACK_ENABLED;
  });

  it("defaults off with not_claimable production status", () => {
    expect(isCompanionEnabled()).toBe(false);
    expect(companionConfig.visitPackEnabled).toBe(false);
    expect(companionConfig.productionClaimStatus).toBe("not_claimable");
    expect(companionConfig.authorityCeiling).toBe(
      "DEVICE_LOCAL_AND_FLAGGED_COMPILE"
    );
  });
});
