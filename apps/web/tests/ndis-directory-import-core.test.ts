import { describe, expect, it } from "vitest";

import {
  normaliseNdisDirectory,
  sha256Hex,
  validAustralianAbn,
} from "@/lib/ingestion/ndis-outlet-import-core";

const A = {
  ABN: "91636315930",
  Prov_N: "Example Plan Management",
  Outletname: "Test Latrobe",
  Address: "Synthetic Street Latrobe TAS 7307",
  Flag: "O",
  Active: 1,
  State_cd: "TAS",
  Post_cd: 7307,
  RegGroup: [33],
  Latitude: -41.2,
  Longitude: 146.4,
  prfsn: "Accountant/Bookkeeper",
};
const B = {
  ...A, Outletname: "Test Sydney",
  Address: "Example Place Sydney NSW 2000",
  State_cd: "NSW", Post_cd: 2000,
  Latitude: -33.8, Longitude: 151.2,
  Active: 0, RegGroup: [5,8],
};
const C = {
  ABN: "92735268277",
  Prov_N: "Sample Personal Care",
  Outletname: "Care Head Office",
  Flag: "H",
  Head_Office: "Gosford NSW 2250",
  State_cd: "NSW",
  Post_cd: 2250,
  Latitude: 0, Longitude: 0,
  RegGroup: [5],
};
function normalise(data: unknown, date = "12 October 2026") {
  return normaliseNdisDirectory({ date, data });
}

describe("NDIA directory source parser", () => {
  it("accepts genuine ABN checksum and rejects invalid or length-only numbers", () => {
    expect(validAustralianAbn("91636315930")).toBe("91636315930");
    expect(validAustralianAbn("92735268277")).toBe("92735268277");
    expect(validAustralianAbn("12345678901")).toBeNull();
    expect(validAustralianAbn("123")).toBeNull();
  });
  it("groups two distinct outlet rows under one ABN provider, not two providers", () => {
    const result = normalise([A,B,C]);
    expect(result.organisations).toHaveLength(2);
    expect(result.outlets).toHaveLength(3);
    expect(result.recognisedRowCount).toBe(3);
    expect(result.meetsQualityGate).toBe(true);
  });
  it("generates reorder-invariant provider and outlet identities", () => {
    const first = normalise([A,B,C]);
    const second = normalise([C,B,A]);
    expect(first.organisations).toEqual(second.organisations);
    expect(first.outlets).toEqual(second.outlets);
  });
  it("preserves distinct non-English outlet names at the same address", () => {
    const p = {...A, Outletname: "北區服務中心"};
    const q = {...A, Outletname: "南區服務中心"};
    const result = normalise([p,q]);
    expect(result.outlets).toHaveLength(2);
    expect(result.organisations).toHaveLength(1);
  });
  it("does not use row index as an outlet identity", () => {
    const first = normalise([A,B]).outlets.map(x=>x.outletKey);
    const second = normalise([B,A]).outlets.map(x=>x.outletKey);
    expect(new Set(first)).toEqual(new Set(second));
    expect(first.every(x=>x.startsWith("outlet:"))).toBe(true);
  });
  it("distinguishes directory Active flag from NDIS Commission registration", () => {
    const result = normalise([A,B]);
    expect(result.outlets.map(x=>x.sourceActiveFlag).sort()).toEqual([false,true]);
    expect(JSON.stringify(result)).not.toContain('"isRegistered":true');
  });
  it("returns null for placeholder zero coordinates, never maps zero as Sydney", () => {
    const result = normalise([C]);
    expect(result.outlets[0]?.latitude).toBeNull();
    expect(result.outlets[0]?.longitude).toBeNull();
  });
  it("rejects out-of-world coordinates without rejecting the complete record", () => {
    const result = normalise([{...C,Latitude:999,Longitude:300}]);
    expect(result.outlets[0]?.latitude).toBeNull();
    expect(result.warnings.some(x=>x.code==="INVALID_COORDINATE")).toBe(true);
  });
  it("maps numbered RegGroup indices via canonical names", () => {
    const result = normalise([A,B]);
    expect(result.organisations[0]?.registrationGroups).toContain("Plan Management");
    expect(result.organisations[0]?.registrationGroups).toContain("Daily Personal Activities");
  });
  it("preserves natural-language professions distinctly from registration groups", () => {
    const result = normalise([A]);
    expect(result.outlets[0]?.professions).toContain("Accountant/Bookkeeper");
    expect(result.outlets[0]?.registrationGroups).toContain("Plan Management");
  });
  it("handles nested provider entries without creating fictitious providers", () => {
    const result = normaliseNdisDirectory({ providers: [{
      ABN: "91636315930", provider_name: "Example Management",
      outlets: [
        { outlet_name: "Outlet North", Address: "A NSW 2000", State_cd:"NSW", Post_cd:2000, RegGroup:[33] },
        { outlet_name: "Outlet South", Address: "B NSW 2000", State_cd:"NSW", Post_cd:2000, RegGroup:[34] },
      ],
    }] });
    expect(result.organisations).toHaveLength(1);
    expect(result.outlets).toHaveLength(2);
  });
  it("never automatically merges unrelated records with invalid ABN merely by name", () => {
    const rows = [{...A,ABN:"12345678901"},{...B,ABN:"12345678901"}];
    const result = normalise(rows);
    expect(result.organisations).toHaveLength(2);
    expect(result.organisations.every(p=>p.identityBasis==="unverified_row")).toBe(true);
    expect(result.warnings.some(w=>w.code==="INVALID_ABN")).toBe(true);
  });
  it("rejects missing provider identities and fails the quality gate", () => {
    const result = normalise([A,{ABN:"91636315930"}]);
    expect(result.rejectedRows).toBe(1);
    expect(result.meetsQualityGate).toBe(false);
  });
  it("deduplicates exact outlet identity and combines registration groups", () => {
    const same = {...A,RegGroup:[34]};
    const result = normalise([A,same]);
    expect(result.outlets).toHaveLength(1);
    expect(result.outlets[0]?.registrationGroups).toContain("Plan Management");
    expect(result.outlets[0]?.registrationGroups).toContain("Support Coordination");
    expect(result.warnings.some(x=>x.code==="OUTLET_DUPLICATE_CONFLICT")).toBe(true);
  });
  it("never infers consent, funding or worker clearance from a source row", () => {
    const result = normalise([{...A, "Eligible to work":"Yes", "Rating":5}]);
    expect(JSON.stringify(result.organisations)).not.toContain("clearance");
    expect(JSON.stringify(result.outlets.map(x=>({key:x.outletKey})))).not.toContain("approved");
  });
  it("validates records count and source wrapper", () => {
    expect(()=>normaliseNdisDirectory({invalid:[]})).toThrow("NDIA_PAYLOAD_ARRAY_MISSING");
    expect(()=>normaliseNdisDirectory({data:[]})).toThrow("NDIA_ROW_COUNT_OUT_OF_RANGE");
  });
  it("hashes raw byte content deterministically", () => {
    expect(sha256Hex(JSON.stringify(A))).toEqual(sha256Hex(JSON.stringify(A)));
    expect(sha256Hex(JSON.stringify(A))).not.toEqual(sha256Hex(JSON.stringify(B)));
  });
});
