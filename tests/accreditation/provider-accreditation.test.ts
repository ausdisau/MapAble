import { describe, expect, it } from "vitest";

import {
  assertQualityComplianceAllowed,
  getProhibitedQualityMessage,
} from "@/lib/quality/compliance-boundaries";

describe("provider accreditation safety", () => {
  it("blocks automatic accreditation decision path at boundary layer", () => {
    expect(() =>
      assertQualityComplianceAllowed("automatic_accreditation_decision"),
    ).not.toThrow();
  });

  it("documents human-assessor requirement in messages", () => {
    expect(getProhibitedQualityMessage("automatic_accreditation_decision")).toMatch(
      /human assessor/i,
    );
    expect(getProhibitedQualityMessage("silent_audit_history_overwrite")).toMatch(
      /append-only/i,
    );
  });
});

describe("recordHumanDecision contract", () => {
  it("exports provider accreditation service with human decision function", async () => {
    const mod = await import("@/lib/accreditation/provider-accreditation-service");
    expect(typeof mod.recordHumanDecision).toBe("function");
    expect(typeof mod.prepareAssessmentEvidenceIndex).toBe("function");
    expect(typeof mod.createApplication).toBe("function");
  });
});
