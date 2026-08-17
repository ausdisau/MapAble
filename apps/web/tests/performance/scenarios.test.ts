import { describe, expect, it } from "vitest";

import {
  LOAD_SCENARIOS,
  validateScenarioThreshold,
} from "./scenarios";

describe("documented load scenarios", () => {
  it("defines baseline scenarios", () => {
    expect(LOAD_SCENARIOS.length).toBeGreaterThanOrEqual(3);
    expect(LOAD_SCENARIOS.some((s) => s.id === "api_read_baseline")).toBe(true);
  });

  it("validates threshold helper", () => {
    const scenario = LOAD_SCENARIOS[0];
    expect(validateScenarioThreshold(scenario, 100)).toBe(true);
    expect(validateScenarioThreshold(scenario, scenario.p95MsThreshold + 1)).toBe(
      false,
    );
  });

  it("documents targets without running live load", () => {
    for (const scenario of LOAD_SCENARIOS) {
      expect(scenario.p95MsThreshold).toBeGreaterThan(0);
      expect(scenario.rpsTarget).toBeGreaterThan(0);
      expect(scenario.target).toBeTruthy();
    }
  });
});
