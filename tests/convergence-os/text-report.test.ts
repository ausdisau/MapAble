import { describe, expect, it } from "vitest";

import { buildConvergenceTextReport } from "@/lib/convergence-os/text-report";

describe("buildConvergenceTextReport", () => {
  it("produces a plain-language accessible report without requiring a graph", () => {
    const report = buildConvergenceTextReport({
      snapshotId: "snap_1",
      baseCommitSha: "abc123",
      scannedAt: "2026-07-16T00:00:00.000Z",
      domainCount: 10,
      prCount: 5,
      dependencyCount: 8,
      collisionCount: 3,
      criticalCollisions: ["CareOSMission multi-writer"],
      mergeTrainName: "FOUNDATION + GOVERNANCE PREP",
      warningLabels: ["drops_indoor", "duplicate_vault_models"],
    });

    expect(report).toContain("MapAble ConvergenceOS");
    expect(report).toMatch(/no automated merges/i);
    expect(report).toContain("CareOSMission multi-writer");
    expect(report).toContain("Authorised humans approve");
    expect(report).not.toContain("<svg");
  });
});
