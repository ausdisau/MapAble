import { describe, expect, it } from "vitest";

import {
  assertJourneySafeDefaults,
  orchestrateShiftNoteDraftJourney,
} from "@/lib/careos/journey-stubs";

describe("shift note drafting journey", () => {
  it("requires worker review and keeps AI disabled", () => {
    const result = orchestrateShiftNoteDraftJourney();
    assertJourneySafeDefaults(result);
    expect(result.humanReviewRequired).toBe(true);
    expect(result.blockedReason).toMatch(/worker review/i);
  });
});
