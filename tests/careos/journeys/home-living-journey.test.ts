import { describe, expect, it } from "vitest";

import {
  assertJourneySafeDefaults,
  orchestrateHomeLivingJourney,
} from "@/lib/careos/journey-stubs";
import { classifyClinicalBoundary } from "@/lib/home-living/home-living-service";

describe("home and living journey", () => {
  it("routes safeguarding-sensitive paths to human review with AI off", () => {
    const result = orchestrateHomeLivingJourney();
    assertJourneySafeDefaults(result);
    expect(result.humanReviewRequired).toBe(true);
  });

  it("blocks prohibited clinical categories from AI decision paths", () => {
    expect(classifyClinicalBoundary("diagnosis")).toBe("prohibited_ai_decision");
    expect(classifyClinicalBoundary("coordination")).toBe("operational_coordination");
  });
});
