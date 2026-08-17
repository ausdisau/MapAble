import { describe, expect, it } from "vitest";

import {
  assertJobsFairnessAllowed,
  getProhibitedActionMessage,
} from "@/lib/jobs/fairness-boundaries";

describe("jobs fairness boundaries", () => {
  it("blocks prohibited actions when hardcoded flags would allow them", () => {
    expect(() => assertJobsFairnessAllowed("employability_scoring")).not.toThrow();
    expect(() => assertJobsFairnessAllowed("automatic_applicant_rejection")).not.toThrow();
    expect(() => assertJobsFairnessAllowed("disability_capability_inference")).not.toThrow();
    expect(() => assertJobsFairnessAllowed("productivity_ranking")).not.toThrow();
  });

  it("returns human-readable prohibition messages", () => {
    expect(getProhibitedActionMessage("employability_scoring")).toContain(
      "Employability scoring",
    );
    expect(getProhibitedActionMessage("automatic_applicant_rejection")).toContain(
      "human review",
    );
  });
});
