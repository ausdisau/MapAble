import { describe, expect, it } from "vitest";
import { previewCommissionCsv, crosswalkCommissionRecord } from "@/lib/ingestion/ndis-commission-csv";
const mapping={registrationId:"Registration Id",legalName:"Legal name",abn:"ABN",status:"Registration status",registrationEnd:"Registration end"};
const csv="Registration Id,Legal name,ABN,Registration status,Registration end\n"
  +"NDIS-001,Example Care,91636315930,Approved,2027-01-31\n"
  +"NDIS-002,\"Another, Provider\",92735268277,Suspended,2026-12-31\n";
describe("NDIS Commission registry CSV isolation",()=>{
 it("inspects source headers without assuming a CSV schema",()=>{
  const r=previewCommissionCsv(csv);expect(r.safeToStage).toBe(false);
  expect(r.warningCodes).toContain("COLUMN_MAPPING_REQUIRED");expect(r.headers).toHaveLength(5);
 });
 it("parses explicit mapping and keeps non-approved registration status",()=>{
  const r=previewCommissionCsv(csv,mapping);expect(r.safeToStage).toBe(true);
  expect(r.records).toHaveLength(2);expect(r.records[1]?.legalName).toBe("Another, Provider");
  expect(r.records[1]?.registrationStatus).toBe("Suspended");
 });
 it("holds unknown statuses and duplicate conflicts",()=>{
  expect(previewCommissionCsv(csv.replace("Suspended","Special"),mapping).safeToStage).toBe(false);
  expect(previewCommissionCsv(csv+csv.split("\n")[1]?.replace("Example Care","Different Entity")+"\n",mapping).safeToStage).toBe(false);
 });
 it("matches strictly by valid ABN and never infers worker clearance",()=>{
  const r=previewCommissionCsv(csv,mapping);
  const x=crosswalkCommissionRecord("91636315930",r.records[0]!);
  expect(x.identity).toBe("EXACT_VALID_ABN");expect(x.registration).toBe("APPROVED_IN_SNAPSHOT");
  expect(x.workerScreening).toBe("NOT_VERIFIED");expect(x.verifiedToday).toBe(false);
 });
 it("blocks malformed quoted CSV and misleading nested headers",()=>{
  expect(()=>previewCommissionCsv('Registration Id,Legal name\n"unterminated',mapping)).toThrow();
  expect(()=>previewCommissionCsv(csv,{...mapping,abn:"Organisation number"})).toThrow();
 });
});
