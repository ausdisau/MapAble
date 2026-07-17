import { describe, expect, it } from "vitest";

import {
  ACCESSCAST_FORECAST_STATES,
  mapConclusionToForecastState,
  rollupForecastState,
} from "@/lib/accesscast";

describe("AccessCast forecast states", () => {
  it("defines all participant-facing states", () => {
    expect(ACCESSCAST_FORECAST_STATES).toContain("stable");
    expect(ACCESSCAST_FORECAST_STATES).toContain("fragile");
    expect(ACCESSCAST_FORECAST_STATES).toContain("cannot_confirm");
    expect(ACCESSCAST_FORECAST_STATES).toContain("stale");
    expect(ACCESSCAST_FORECAST_STATES).toHaveLength(9);
  });

  it("rolls up to the worst segment state", () => {
    expect(
      rollupForecastState(["stable", "fragile", "likely_usable"]),
    ).toBe("fragile");
    expect(
      rollupForecastState(["cannot_confirm", "temporarily_unavailable"]),
    ).toBe("temporarily_unavailable");
  });

  it("maps AI Next conclusions without inventing a universal score", () => {
    expect(mapConclusionToForecastState("cannot_confirm")).toBe("cannot_confirm");
    expect(
      mapConclusionToForecastState("compatible", { hasFailedHard: true }),
    ).toBe("temporarily_unavailable");
    expect(
      mapConclusionToForecastState("likely_compatible", {
        hasSpofWithoutFallback: true,
      }),
    ).toBe("fragile");
  });
});
