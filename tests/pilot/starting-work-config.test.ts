import { afterEach, describe, expect, it } from "vitest";

import {
  isStartingWorkPilotEnabled,
  startingWorkPilotConfig,
} from "@/lib/config/starting-work-pilot";
import { getStartingWorkLoopStatus } from "@/lib/pilot/starting-work/loop-status";

describe("Starting Work pilot repair honesty", () => {
  afterEach(() => {
    delete process.env.MAPABLE_STARTING_WORK_PILOT_ENABLED;
    delete process.env.MAPABLE_STARTING_WORK_SYNTHETIC_ONLY;
    delete process.env.MAPABLE_STARTING_WORK_DB_PERSISTENCE_ENABLED;
  });

  it("defaults fail-closed and is not a live booking engine", () => {
    expect(isStartingWorkPilotEnabled()).toBe(false);
    expect(startingWorkPilotConfig.syntheticOnly).toBe(true);
    expect(startingWorkPilotConfig.productionClaimStatus).toBe("not_claimable");
    expect(startingWorkPilotConfig.isLiveBookingEngine).toBe(false);
  });

  it("exposes honest Care/Transport/Billing loop maturity without scores", () => {
    const loops = getStartingWorkLoopStatus();
    expect(loops).toBeTruthy();
    const serialized = JSON.stringify(loops);
    expect(serialized).not.toMatch(/successScore|starRating|universalScore/i);
  });
});
