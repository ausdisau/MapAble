import { describe, expect, it } from "vitest";
import { isValidAbn, normaliseCommissionCsv, parseCommissionCsv, validateCommissionColumnMap } from "@/lib/commission-register/csv";

const headers = ["Provider legal name", "Provider business name", "ABN", "Registration status", "State"];
const map = { legalName: headers[0]!, businessName: headers[1]!, abn: headers[2]!, registrationStatus: headers[3]!, state: headers[4]! };

describe("Commission CSV — regulator data must fail closed", () => {
  it("parses BOM, commas, escaped quotes, and multiline CSV", () => {
    const rows = parseCommissionCsv('\uFEFFProvider legal name,Provider business name,ABN,Registration status,State\r\n"Example, Ltd","Example ""Accessible""\nCare",53004085616,Approved,NSW\r\n');
    expect(rows).toHaveLength(2);
    expect(rows[1]![0]).toBe("Example, Ltd");
    expect(rows[1]![1]).toContain('Example "Accessible"\nCare');
  });
  it("rejects invalid format, header mismatch and unsupported status", () => {
    expect(() => parseCommissionCsv('A,B,C\n"unterminated')).toThrow();
    expect(() => validateCommissionColumnMap(headers, { ...map, abn: "Unknown column" })).toThrow();
    const unknown = parseCommissionCsv("Provider legal name,Provider business name,ABN,Registration status,State\nExample,Test,53004085616,Pending,NSW");
    expect(() => normaliseCommissionCsv(unknown, map)).toThrow(/Unrecognised registration status/);
  });
  it("validates ABNs and preserves row-level evidence without asserting worker clearance", () => {
    const rows = parseCommissionCsv("Provider legal name,Provider business name,ABN,Registration status,State\nExample,Test,53004085616,Approved,NSW");
    expect(isValidAbn("53004085616")).toBe(true);
    expect(isValidAbn("53004085617")).toBe(false);
    expect(normaliseCommissionCsv(rows, validateCommissionColumnMap(rows[0]!, map))).toMatchObject([{ registrationStatus: "Approved", abn: "53004085616", rowNumber: 2 }]);
  });
  it("rejects conflicting status for same official registration identity", () => {
    const rows = parseCommissionCsv("Provider legal name,Provider business name,ABN,Registration status,State\nExample,Test,53004085616,Approved,NSW\nExample,Test,53004085616,Revoked,NSW");
    expect(() => normaliseCommissionCsv(rows, map)).toThrow(/Conflicting statuses/);
  });
});
