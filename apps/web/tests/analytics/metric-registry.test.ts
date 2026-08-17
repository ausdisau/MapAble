import { describe, expect, it } from "vitest";

import { CORE_METRICS } from "@/lib/platform/analytics/metric-registry";

describe("metric registry catalogue", () => {
  it("covers care, transport, safeguarding, and engagement modules", () => {
    const modules = new Set(CORE_METRICS.map((m) => m.module));
    expect(modules.has("care")).toBe(true);
    expect(modules.has("transport")).toBe(true);
    expect(modules.has("safeguarding")).toBe(true);
    expect(modules.has("engagement")).toBe(true);
  });

  it("assigns unique keys", () => {
    const keys = CORE_METRICS.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
