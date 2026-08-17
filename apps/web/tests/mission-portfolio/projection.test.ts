import { beforeEach, describe, expect, it } from "vitest";

import {
  diffMissionProjections,
  getServiceStandardForMission,
  listMissions,
  projectStartingWorkMission,
} from "@/lib/platform/mission-portfolio";
import {
  createStartingWorkJourney,
  runGoldenJourney,
} from "@/lib/pilot/starting-work/golden-journey";

describe("mission portfolio registry", () => {
  it("registers Starting Work without claiming write ownership", () => {
    const missions = listMissions();
    expect(missions[0]?.key).toBe("mission.starting_work");
    expect(missions[0]?.prohibitedWriters).toContain("lib/platform/mission-portfolio");
    expect(missions[0]?.canonicalProjection).toContain("starting-work");
  });
});

describe("shared mission projection", () => {
  beforeEach(() => {
    process.env.MAPABLE_MISSION_PORTFOLIO_ENABLED = "true";
    process.env.MAPABLE_SERVICE_STANDARD_ENABLED = "true";
    process.env.MAPABLE_WHAT_CHANGED_ENABLED = "true";
  });

  it("returns null when portfolio disabled", () => {
    process.env.MAPABLE_MISSION_PORTFOLIO_ENABLED = "false";
    expect(projectStartingWorkMission(createStartingWorkJourney())).toBeNull();
  });

  it("projects Starting Work dependencies read-only", () => {
    const state = runGoldenJourney({});
    const projection = projectStartingWorkMission(state);
    expect(projection).not.toBeNull();
    expect(projection!.missionKey).toBe("mission.starting_work");
    expect(projection!.productionClaim).toBe("none");
    expect(projection!.dependencies.length).toBeGreaterThan(0);
    expect(projection!.goal).toContain("Harbour");
  });

  it("surfaces decisions when blocked", () => {
    const state = runGoldenJourney({ failureMode: "expired_consent" });
    const projection = projectStartingWorkMission(state);
    expect(projection!.decisionsRequired.length).toBeGreaterThan(0);
  });

  it("provides service standard clauses when enabled", () => {
    const clauses = getServiceStandardForMission("mission.starting_work");
    expect(clauses.some((c) => c.id === "ss.communication_passport")).toBe(true);
  });

  it("diffs What Changed between projections", () => {
    const before = projectStartingWorkMission(createStartingWorkJourney())!;
    const after = projectStartingWorkMission(runGoldenJourney({}))!;
    const changes = diffMissionProjections(before, after);
    expect(Array.isArray(changes)).toBe(true);
  });
});
