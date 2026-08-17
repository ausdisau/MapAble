import { describe, expect, it } from "vitest";

import {
  assertJourneySafeDefaults,
  orchestrateMarketplaceDiscoveryJourney,
} from "@/lib/careos/journey-stubs";

describe("marketplace post-discovery journey", () => {
  it("stops at shortlist with confirmation required and AI off", () => {
    const result = orchestrateMarketplaceDiscoveryJourney();
    assertJourneySafeDefaults(result);
    expect(result.blockedReason).toMatch(/disclosure/i);
  });
});
