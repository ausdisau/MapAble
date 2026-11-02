/**
 * NDIA Provider Finder export normaliser.
 *
 * Pure, deterministic parsing only. Source is an NDIA DIRECTORY SNAPSHOT,
 * NOT authoritative current NDIS Commission registration or worker screening.
 * Never assign isRegistered=true, verify staff, infer accessibility or prices.
 *
 * Supports official flattened { date, data: [{ABN,Prov_N,Outletname,...}] }
 * and bounded nested { providers: [{outlets:[...]}] } payloads.
 */
import { createHash } from "node:crypto";

import { z } from "zod";

import { regGroupIndicesToCategories } from "@/app/provider-finder/regGroupOptions";

const RecordSchema = z.record(z.string(), z.unknown());
const MAX_SOURCE_ROWS = 250_000;
const MAX_NESTED_OUTLETS = 1_000;
const MAX_REJECTION_RATIO = 0.05;

export type NdisDirectoryOrganisation = {
  organisationKey: string;
  name: string;
  abn: string | null;
  identityBasis: "valid_abn" | "external_id" | "unverified_row";
  registrationGroups: string[];
};
export type NdisDirectoryOutlet = {
  outletKey: string;
  organisationKey: string;
  outletName: string;
  address: string | null;
  headOffice: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  flag: "O" | "H" | null;
  sourceActiveFlag: boolean | null;
  registrationGroups: string[];
  professions: string[];
  openingHours: string | null;
  recordHash: string;
  raw: Record<string, unknown>;
};
export type NdisDirectoryWarning = {
  row: number;
  code: "NON_RECORD" | "NO_PROVIDER_NAME" | "INVALID_ABN" |
    "NO_STABLE_ORG_ID" | "INVALID_COORDINATE" | "OUTLET_DUPLICATE_CONFLICT" |
    "UNKNOWN_REGISTRATION_GROUP" | "INVALID_NESTED_OUTLET";
};
export type NdisDirectoryBatch = {
  sourceDate: string | null;
  inputRowCount: number;
  recognisedRowCount: number;
  organisations: NdisDirectoryOrganisation[];
  outlets: NdisDirectoryOutlet[];
  rejectedRows: number;
  warnings: NdisDirectoryWarning[];
  meetsQualityGate: boolean;
};

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
function obj(value: unknown): Record<string, unknown> | null {
  const parsed = RecordSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
function str(v: unknown, max = 300): string | null {
  if (typeof v === "string") return v.trim().slice(0, max) || null;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}
function first(o: Record<string, unknown>, names: string[], max = 300): string | null {
  for (const k of names) {
    const s = str(o[k], max);
    if (s) return s;
  }
  return null;
}
function normal(s: string): string {
  return s.normalize("NFKC").toLocaleLowerCase("en-AU")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}
function number(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
function sourcePostcode(v: unknown): string | null {
  const n = str(v, 12);
  if (!n) return null;
  if (/^\d{1,4}$/.test(n)) return n.padStart(4, "0");
  return null;
}
function sourceState(v: unknown): string | null {
  const candidate = str(v, 6)?.toUpperCase();
  return candidate && ["NSW","VIC","QLD","WA","SA","TAS","ACT","NT"].includes(candidate)
    ? candidate : null;
}
function abnDigits(v: unknown): string | null {
  const s = str(v, 25)?.replace(/\s+/g, "");
  return s && /^\d{11}$/.test(s) ? s : null;
}
/** Actual Australian ABN checksum; format alone is insufficient. */
export function validAustralianAbn(value: unknown): string | null {
  const abn = abnDigits(value);
  if (!abn) return null;
  const w = [10,1,3,5,7,9,11,13,15,17,19];
  const sum = [...abn].reduce((n,d,i) =>
    n + (Number(d) - (i === 0 ? 1 : 0)) * w[i]!, 0);
  return sum % 89 === 0 ? abn : null;
}
function lists(raw: unknown): string[] {
  const v = Array.isArray(raw) ? raw.map((x) => typeof x === "string"
    ? x.trim() : typeof x === "number" ? String(x) : "") :
      typeof raw === "string" ? raw.split(/[|;,]/).map((x) => x.trim()) : [];
  return [...new Set(v.filter(Boolean).map(x => x.slice(0,160)))].sort();
}
function regGroups(raw: Record<string, unknown>, row: number, warnings: NdisDirectoryWarning[]): string[] {
  const indices = raw.RegGroup ?? raw.regGroup;
  if (Array.isArray(indices)) {
    const nums = indices.filter((x): x is number => typeof x === "number" && Number.isInteger(x));
    if (nums.length !== indices.length) warnings.push({ row, code: "UNKNOWN_REGISTRATION_GROUP" });
    const names = regGroupIndicesToCategories(nums);
    if (names.length !== nums.length) warnings.push({ row, code: "UNKNOWN_REGISTRATION_GROUP" });
    return [...new Set(names)].sort();
  }
  return lists(raw.registrationGroups ?? raw.registration_groups ?? raw.reg_groups);
}
function coordinates(raw: Record<string, unknown>, row: number, warnings: NdisDirectoryWarning[]): {
  latitude: number | null; longitude: number | null;
} {
  const lat = number(raw.Latitude ?? raw.latitude ?? raw.lat);
  const lng = number(raw.Longitude ?? raw.longitude ?? raw.lng ?? raw.lon);
  if (lat === null || lng === null || lat === 0 || lng === 0) {
    return { latitude: null, longitude: null };
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    warnings.push({ row, code: "INVALID_COORDINATE" });
    return { latitude: null, longitude: null };
  }
  return { latitude: lat, longitude: lng };
}
function mergeStrings(a: readonly string[], b: readonly string[]): string[] {
  return [...new Set([...a, ...b])].sort();
}
function parseEntries(payload: unknown): { sourceDate: string | null; entries: unknown[] } {
  if (Array.isArray(payload)) return { sourceDate: null, entries: payload };
  const root = obj(payload);
  if (!root) throw new Error("NDIA_PAYLOAD_INVALID");
  const entries = Array.isArray(root.data) ? root.data :
    Array.isArray(root.providers) ? root.providers :
    Array.isArray(root.results) ? root.results : null;
  if (!entries) throw new Error("NDIA_PAYLOAD_ARRAY_MISSING");
  return { sourceDate: first(root, ["date", "asOf", "as_of"], 100), entries };
}
export function normaliseNdisDirectory(payload: unknown): NdisDirectoryBatch {
  const { entries, sourceDate } = parseEntries(payload);
  if (entries.length === 0 || entries.length > MAX_SOURCE_ROWS) {
    throw new Error("NDIA_ROW_COUNT_OUT_OF_RANGE");
  }
  const organisations = new Map<string, NdisDirectoryOrganisation>();
  const outlets = new Map<string, NdisDirectoryOutlet>();
  const warnings: NdisDirectoryWarning[] = [];
  let rejectedRows = 0;
  let recognisedRowCount = 0;

  for (let i=0; i<entries.length; i+=1) {
    const parent = obj(entries[i]);
    if (!parent) { rejectedRows += 1; warnings.push({ row:i, code:"NON_RECORD" }); continue; }
    const parentName = first(parent, ["Prov_N","provider_name","providerName","organisation_name",
      "legal_name","legalName","name","Outletname","outletName"], 220);
    if (!parentName) { rejectedRows += 1; warnings.push({ row:i, code:"NO_PROVIDER_NAME" }); continue; }

    const nested = Array.isArray(parent.outlets) ? parent.outlets :
      Array.isArray(parent.locations) ? parent.locations : null;
    if (nested && nested.length > MAX_NESTED_OUTLETS) throw new Error("NDIA_NESTED_LIMIT_EXCEEDED");
    const sourceRows = nested?.length ? nested : [parent];
    for (let j=0; j<sourceRows.length; j+=1) {
      const child = obj(sourceRows[j]);
      if (!child) { rejectedRows+=1; warnings.push({row:i, code:"INVALID_NESTED_OUTLET"}); continue; }
      const raw: Record<string,unknown> = { ...parent, ...child };
      delete raw.outlets;
      delete raw.locations;
      const abnValue = first(raw, ["ABN","abn","provider_abn"], 25);
      const abn = validAustralianAbn(abnValue);
      if (abnValue && !abn) warnings.push({row:i, code:"INVALID_ABN"});

      const providerExternal = first(parent,
        ["provider_id","providerId","organisation_id","organisationId"], 100);
      const organisationKey = abn ? "abn:" + abn :
        providerExternal ? "external:" + sha256Hex(normal(providerExternal)).slice(0,32) :
          "unverified:" + sha256Hex(JSON.stringify(raw)).slice(0,32);
      if (!abn && !providerExternal) warnings.push({row:i, code:"NO_STABLE_ORG_ID"});

      const outletName = first(raw,
        ["Outletname","outletName","outlet_name","branch_name","name"], 220) ?? parentName;
      const address = first(raw, ["Address","address","street_address","addressLine1"], 400);
      const headOffice = first(raw, ["Head_Office","headOffice","head_office"], 300);
      const state = sourceState(raw.State_cd ?? raw.state ?? raw.state_code);
      const postcode = sourcePostcode(raw.Post_cd ?? raw.postcode ?? raw.post_code);
      const suburb = first(raw, ["Suburb","suburb","locality"], 128);
      const flag = raw.Flag === "O" || raw.Flag === "H" ? raw.Flag : null;
      const externalOutletId = first(child,
        ["outlet_id","outletId","locationId","location_id"], 120);
      const keyFields = externalOutletId
        ? [organisationKey, "explicit", normal(externalOutletId)]
        : [organisationKey, "address", normal(outletName),
          normal(address ?? headOffice ?? ""), state ?? "", postcode ?? "", flag ?? ""];
      if (!externalOutletId && !address && !headOffice) keyFields.push(sha256Hex(JSON.stringify(raw)));
      const outletKey = "outlet:" + sha256Hex(keyFields.join("|")).slice(0,40);
      const groups = regGroups(raw, i, warnings);
      const prfsn = lists(raw.prfsn ?? raw.professions ?? raw.Professions);
      const coords = coordinates(raw, i, warnings);
      const rawHash = sha256Hex(JSON.stringify(raw));

      const org = organisations.get(organisationKey);
      if (org) {
        organisations.set(organisationKey, {
          ...org,
          name: [org.name, parentName].sort((a,b) => a.localeCompare(b))[0]!,
          registrationGroups: mergeStrings(org.registrationGroups, groups),
        });
      } else {
        organisations.set(organisationKey, {
          organisationKey, name: parentName, abn,
          identityBasis: abn ? "valid_abn" : providerExternal ? "external_id" : "unverified_row",
          registrationGroups: groups,
        });
      }

      const existing = outlets.get(outletKey);
      const item: NdisDirectoryOutlet = {
        outletKey, organisationKey, outletName, address, headOffice,
        suburb, state, postcode, ...coords,
        phone: first(raw, ["Phone","phone","telephone","phoneNumber"], 80),
        email: first(raw, ["Email","email","emailAddress"], 320),
        website: first(raw, ["Website","website","web","url"], 500),
        flag,
        sourceActiveFlag: raw.Active === 1 || raw.Active === true ? true :
          raw.Active === 0 || raw.Active === false ? false : null,
        registrationGroups: groups,
        professions: prfsn,
        openingHours: first(raw, ["opnhrs","openingHours","opening_hours"], 1000),
        recordHash: rawHash,
        raw,
      };
      if (!existing) outlets.set(outletKey, item);
      else {
        // Preserve combined categories without silently overwriting conflicting
        // contact details. Representative is deterministic by record hash.
        if (existing.recordHash !== item.recordHash) {
          warnings.push({row:i, code:"OUTLET_DUPLICATE_CONFLICT"});
        }
        const chosen = existing.recordHash <= item.recordHash ? existing : item;
        outlets.set(outletKey, {
          ...chosen,
          registrationGroups: mergeStrings(existing.registrationGroups, item.registrationGroups),
          professions: mergeStrings(existing.professions, item.professions),
          sourceActiveFlag: existing.sourceActiveFlag === item.sourceActiveFlag
            ? existing.sourceActiveFlag : null,
        });
      }
      recognisedRowCount += 1;
    }
  }
  const failRatio = rejectedRows / Math.max(1, recognisedRowCount + rejectedRows);
  return {
    sourceDate, inputRowCount: entries.length, recognisedRowCount,
    organisations: [...organisations.values()].sort((a,b) => a.organisationKey.localeCompare(b.organisationKey)),
    outlets: [...outlets.values()].sort((a,b) => a.outletKey.localeCompare(b.outletKey)),
    rejectedRows,
    warnings: warnings.slice(0, 250),
    meetsQualityGate: recognisedRowCount > 0 && failRatio <= MAX_REJECTION_RATIO,
  };
}
