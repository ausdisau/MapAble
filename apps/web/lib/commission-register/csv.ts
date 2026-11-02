/**
 * Untrusted Commission CSV parser and explicit schema contract. No guessed headers
 * or unknown status values are silently accepted. Import is local-CLI only.
 */
export type CommissionColumnMap = {
  legalName: string;
  registrationStatus: string;
  abn?: string;
  registrationNumber?: string;
  businessName?: string;
  state?: string;
};

export type CommissionRecord = {
  rowNumber: number;
  abn: string | null;
  registrationNumber: string | null;
  legalName: string;
  businessName: string | null;
  registrationStatus: "Approved" | "Suspended" | "Revoked";
  state: string | null;
  raw: Record<string, string>;
};

const MAX_FIELD_LENGTH = 10_000;
const ALLOWED_STATES = new Set(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]);

/** RFC4180-style quoted multiline CSV, with CRLF and UTF-8 BOM support. */
export function parseCommissionCsv(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let closedQuote = false;
  const addField = () => { row.push(field); field = ""; closedQuote = false; };
  const addRow = () => {
    addField();
    // Allow blank lines, but never drop a partially filled record.
    if (row.length !== 1 || row[0] !== "") rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else { quoted = false; closedQuote = true; }
      } else {
        field += ch;
      }
    } else if (ch === ",") {
      addField();
    } else if (ch === "\r" || ch === "\n") {
      addRow();
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
    } else if (ch === '"' && field.length === 0 && !closedQuote) {
      quoted = true;
    } else if (closedQuote) {
      throw new Error("Non-delimiter text after closing CSV quote");
    } else if (ch === '"') {
      throw new Error("Unexpected quote inside unquoted CSV value");
    } else {
      field += ch;
    }
    if (field.length > MAX_FIELD_LENGTH) throw new Error("CSV field exceeds length limit");
  }
  if (quoted) throw new Error("Unterminated quoted CSV field");
  if (field || row.length || closedQuote) addRow();
  if (!rows.length) throw new Error("CSV contains no headers or data");
  const width = rows[0]!.length;
  if (width < 3) throw new Error("CSV has too few columns for provider registration");
  if (new Set(rows[0]).size !== width) throw new Error("CSV has duplicate column headers");
  for (let i = 1; i < rows.length; i += 1) {
    if (rows[i]!.length !== width) {
      throw new Error(`CSV record ${i + 1} has ${rows[i]!.length} columns; expected ${width}`);
    }
  }
  return rows;
}

export function validateCommissionColumnMap(
  headers: string[],
  input: unknown,
): CommissionColumnMap {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Provide an approved JSON column map");
  }
  const map = input as Record<string, unknown>;
  const allowed = new Set(["legalName", "registrationStatus", "abn", "registrationNumber", "businessName", "state"]);
  for (const key of Object.keys(map)) if (!allowed.has(key)) throw new Error(`Unexpected column map key: ${key}`);
  for (const required of ["legalName", "registrationStatus"]) {
    if (typeof map[required] !== "string" || !map[required]) {
      throw new Error(`Column mapping missing ${required}`);
    }
  }
  if (!map.abn && !map.registrationNumber) throw new Error("Map ABN or registration number");
  const values = Object.values(map);
  for (const value of values) {
    if (typeof value !== "string" || !headers.includes(value)) {
      throw new Error(`Column mapping does not match exact CSV header: ${String(value)}`);
    }
  }
  if (new Set(values).size !== values.length) throw new Error("Two fields mapped to one CSV column");
  return map as CommissionColumnMap;
}

/** Australian Business Number checksum (ABR weighting). */
export function isValidAbn(abn: string): boolean {
  if (!/^\d{11}$/.test(abn)) return false;
  const digits = abn.split("").map(Number);
  digits[0] -= 1;
  return digits.reduce((sum, d, i) => sum + d * [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19][i]!, 0) % 89 === 0;
}

export function normaliseCommissionCsv(
  rows: string[][],
  columnMap: CommissionColumnMap,
): CommissionRecord[] {
  const header = rows[0]!;
  const mappedIndex = Object.fromEntries(header.map((key, idx) => [key, idx]));
  const output: CommissionRecord[] = [];
  const statuses = new Map<string, string>();
  for (let i = 1; i < rows.length; i += 1) {
    const values = rows[i]!;
    const get = (key?: string): string =>
      key ? (values[mappedIndex[key]!] ?? "").trim() : "";
    const abn = get(columnMap.abn).replace(/\s/g, "");
    const registrationNumber = get(columnMap.registrationNumber);
    const legalName = get(columnMap.legalName);
    const businessName = get(columnMap.businessName);
    const status = get(columnMap.registrationStatus).toLowerCase();
    const state = get(columnMap.state).toUpperCase();
    if (!legalName || legalName.length > 300 || businessName.length > 300) throw new Error(`Invalid provider name at row ${i + 1}`);
    if (!abn && !registrationNumber) throw new Error(`Missing both ABN and registration number at row ${i + 1}`);
    if (abn && !isValidAbn(abn)) throw new Error(`Invalid ABN at row ${i + 1}`);
    if (registrationNumber.length > 120) throw new Error(`Registration number too long at row ${i + 1}`);
    if (!["approved", "suspended", "revoked"].includes(status)) {
      throw new Error(`Unrecognised registration status at row ${i + 1}: ${status || "(blank)"}`);
    }
    if (state && !ALLOWED_STATES.has(state)) throw new Error(`Unknown state at row ${i + 1}: ${state}`);
    const identity = registrationNumber ? `registration:${registrationNumber}` : `abn:${abn}`;
    const previousStatus = statuses.get(identity);
    if (previousStatus && previousStatus !== status) {
      throw new Error(`Conflicting statuses for ${identity} within one CSV snapshot (row ${i + 1})`);
    }
    statuses.set(identity, status);
    output.push({
      rowNumber: i + 1, abn: abn || null,
      registrationNumber: registrationNumber || null,
      legalName, businessName: businessName || null,
      registrationStatus: (status[0]!.toUpperCase() + status.slice(1)) as CommissionRecord["registrationStatus"],
      state: state || null,
      raw: Object.fromEntries(header.map((key, idx) => [key, values[idx]!])),
    });
  }
  if (output.length < 1) throw new Error("CSV has no provider records");
  return output;
}
