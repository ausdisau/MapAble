import { describe, expect, it } from "vitest";

import {
  getWorkerJurisdictionPathway,
  SCREENING_JURISDICTIONS,
} from "@/lib/workers/ndiswc-jurisdictions";

describe("Australian NDIS worker screening unit routing — eight jurisdictions", () => {
  it("exposes every state and territory without claiming a clearance", () => {
    expect(SCREENING_JURISDICTIONS).toEqual([
      "NSW", "VIC", "ACT", "QLD", "WA", "SA", "TAS", "NT",
    ]);
    for (const jurisdiction of SCREENING_JURISDICTIONS) {
      const p = getWorkerJurisdictionPathway(jurisdiction);
      expect(p.jurisdiction).toBe(jurisdiction);
      expect(p.automaticClearanceVerified).toBe(false);
      expect(p.publicWorkerLookupAvailable).toBe(false);
      expect(p.observedScreeningStatus).toBe("NOT_INDEPENDENTLY_VERIFIED");
      expect(p.nationalVerificationUrl).toMatch(/^https:\/\/www.ndiscommission.gov.au\//);
      expect(p.applicationSteps.length).toBeGreaterThanOrEqual(3);
      expect(p.localCheckNote.length).toBeGreaterThan(25);
      for (const url of [p.workerPrimaryUrl,p.screeningUnitUrl]) {
        const parsed = new URL(url);
        expect(parsed.protocol).toBe("https:");
        expect(parsed.username).toBe("");
        expect(parsed.password).toBe("");
        expect(parsed.search).toBe("");
        expect(parsed.hostname.endsWith(".gov.au")).toBe(true);
      }
    }
  });
  it("keeps NSW worker's own MyServiceNSW check separate from employer portal", () => {
    const p = getWorkerJurisdictionPathway("NSW");
    expect(p.workerPrimaryUrl).toContain("ndiswc-check-status");
    expect(p.summary).toMatch(/website/);
    expect(p.publicWorkerLookupAvailable).toBe(false);
  });
  it("routes Victoria to Service Victoria instructions and retains no-clearance-no-start", () => {
    const p = getWorkerJurisdictionPathway("VIC");
    expect(p.workerPrimaryUrl).toBe("https://www.vic.gov.au/ndis-worker-screening-check");
    expect(p.workWhilePending).toBe("NO_CLEARANCE_NO_START_WITH_NARROW_EXCEPTIONS");
    expect(p.applicationSteps.join(" ")).toMatch(/employer ID/i);
    expect(p.localChecks).toBe("SEPARATE_WWC_MAY_APPLY");
    expect(p.helpWithoutPhone.join(" ")).toMatch(/offline\/manual/);
  });
  it("keeps ACT WWVP and NDIS clearance as separate relevant statuses", () => {
    const p = getWorkerJurisdictionPathway("ACT");
    expect(p.workerPrimaryUrl).toContain("wwvp-and-the-ndis");
    expect(p.summary).toMatch(/NDIS ACTIVITIES - Yes/);
    expect(p.localChecks).toBe("WWVP_INCLUDES_OPTIONAL_NDIS_CLEARANCE");
    expect(p.applicationSteps.join(" ")).toMatch(/NDIS clearance/);
    expect(p.applicationSteps.join(" ")).toMatch(/does not/);
    expect(p.workWhilePending).toBe("VERIFY_CURRENT_STATE_RULES_NO_AUTOMATIC_PERMISSION");
  });
  it("keeps QLD worker portal and separate Blue Card, with no card no start", () => {
    const p = getWorkerJurisdictionPathway("QLD");
    expect(p.workerPrimaryUrl).toContain("workerscreening.qld.gov.au");
    expect(p.workWhilePending).toBe("NO_CLEARANCE_NO_START_WITH_NARROW_EXCEPTIONS");
    expect(p.localChecks).toBe("COMBINED_BLUE_CARD_OPTION");
    expect(p.localCheckNote).toMatch(/both/i);
  });
  it("routes WA workers via Department of Communities and DoTDirect", () => {
    const p = getWorkerJurisdictionPathway("WA");
    expect(p.workerPrimaryUrl).toBe(
      "https://www.wa.gov.au/organisation/department-of-communities/applying-ndis-check",
    );
    expect(p.applicationSteps.join(" ")).toMatch(/DoTDirect/);
    expect(p.localChecks).toBe("SEPARATE_WWCC_MAY_APPLY");
    expect(p.workWhilePending).not.toBe("NO_CLEARANCE_NO_START_WITH_NARROW_EXCEPTIONS");
  });
  it("does not invent current local legal conclusions for less-inspected SA/TAS/NT", () => {
    for (const j of ["SA","TAS","NT"] as const) {
      const p = getWorkerJurisdictionPathway(j);
      expect(p.workWhilePending).toBe("VERIFY_CURRENT_STATE_RULES_NO_AUTOMATIC_PERMISSION");
      expect(p.localChecks).toBe("CHECK_LOCAL_REQUIREMENTS");
    }
  });
});
