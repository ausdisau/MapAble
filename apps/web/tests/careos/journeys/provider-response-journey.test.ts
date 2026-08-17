import { describe, expect, it } from "vitest";

import {
  assertJourneySafeDefaults,
  orchestrateProviderResponseJourney,
} from "@/lib/careos/journey-stubs";

describe("provider response journey", () => {
  it("runs with AI disabled and requires confirmation", () => {
    const result = orchestrateProviderResponseJourney();
    assertJourneySafeDefaults(result);
    expect(result.aiEnabled).toBe(false);
    expect(result.confirmationRequired).toBe(true);
    expect(result.humanReviewRequired).toBe(true);
    expect(result.noOperationalChangeMade).toBe(true);
  });
});
