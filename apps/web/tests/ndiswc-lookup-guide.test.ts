import { describe, expect, it } from "vitest";
import {
  CURRENT_NDIS_SCREENING_STATUS, NSW_NDISWC_LIVE_LOOKUP_ENABLED,
  NDISWC_AUDIENCES, OFFICIAL_SCREENING_TERMS,
  explainOfficialScreeningTerm, getNdiswcPathway,
} from "@/lib/workers/ndiswc-lookup-guide";

describe("NSW and national NDISWC lookup pathway — no private query", () => {
  it("provides official paths without claiming any live clearance", () => {
    expect(NSW_NDISWC_LIVE_LOOKUP_ENABLED).toBe(false);
    expect(CURRENT_NDIS_SCREENING_STATUS).toBe("NOT_INDEPENDENTLY_VERIFIED");
    expect(NDISWC_AUDIENCES.length).toBeGreaterThan(5);
    for (const { id } of NDISWC_AUDIENCES) {
      const p=getNdiswcPathway(id);
      expect(p.officialPortalUrl.startsWith("https://")).toBe(true);
      expect(p.canUsePublicWorkerNameSearch).toBe(false);
      expect(p.automaticallyVerifiedByMapAble).toBe(false);
    }
  });
  it("keeps distinct NSW application and national database status vocabularies", () => {
    expect(OFFICIAL_SCREENING_TERMS.nsw_application.map(x=>x.label)).toContain("Pending verification");
    expect(OFFICIAL_SCREENING_TERMS.national_screening.map(x=>x.label)).not.toContain("Pending verification");
    expect(OFFICIAL_SCREENING_TERMS.national_screening.map(x=>x.label)).toEqual([
      "Clearance","Pending","Interim bar","Exclusion","Suspension","No valid clearance",
    ]);
  });
  it("explains labels without verifying a named worker", () => {
    const result=explainOfficialScreeningTerm("national_screening","Clearance");
    expect(result.found).toBe(true);
    expect(result.userSelectionIsEvidence).toBe(false);
    expect(result.observedWorkerStatus).toBe("NOT_INDEPENDENTLY_VERIFIED");
  });
  it("routes registered, unregistered and participant audiences differently", () => {
    expect(getNdiswcPathway("registered_provider").officialPortalUrl).toContain("registered-providers-portal-login");
    expect(getNdiswcPathway("unregistered_provider").officialPortalUrl).toContain("unregistered-providers-portal-login");
    expect(getNdiswcPathway("self_or_plan_managed_participant").officialPortalUrl).toContain("self-managed-participants-portal-login");
  });
});
