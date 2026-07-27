/**
 * Australian Business Number (ABN) utilities for mapableau-new.
 *
 * Pure functions — no database calls, no network. Ported verbatim from
 * REPL shared/abn-utils.ts with no changes needed.
 *
 * Usage:
 *   import { validateAbn, formatAbn, lookupAbnRegistry } from "@/lib/ndis/abn-utils";
 *
 * Environment variable for ABR registry lookups (optional):
 *   ABR_GUID  — Australian Business Register API GUID
 *              If absent, format-only validation still works.
 */

const ABN_WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

export function stripAbn(abn: string): string {
  return abn.replace(/\s/g, "");
}

export function formatAbn(abn: string): string {
  const digits = stripAbn(abn);
  if (digits.length !== 11) return abn;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`;
}

export function validateAbnChecksum(abn: string): boolean {
  const digits = stripAbn(abn);
  if (!/^\d{11}$/.test(digits)) return false;
  const nums = digits.split("").map(Number);
  nums[0] -= 1;
  const sum = nums.reduce((acc, digit, i) => acc + digit * ABN_WEIGHTS[i], 0);
  return sum % 89 === 0;
}

export function validateAbn(abn: string): { valid: boolean; error?: string; formatted?: string } {
  const digits = stripAbn(abn);
  if (!digits) return { valid: false, error: "ABN is required" };
  if (!/^\d+$/.test(digits)) return { valid: false, error: "ABN must contain only digits" };
  if (digits.length !== 11) return { valid: false, error: "ABN must be exactly 11 digits" };
  if (!validateAbnChecksum(abn)) {
    return { valid: false, error: "ABN checksum is invalid — please check the number" };
  }
  return { valid: true, formatted: formatAbn(digits) };
}

// ---------------------------------------------------------------------------
// ABR registry lookup (requires ABR_GUID env var)
// ---------------------------------------------------------------------------

export interface AbnLookupResult {
  abn: string;
  abnFormatted: string;
  entityName: string;
  businessNames: string[];
  tradingNames: string[];
  abnStatus: string;
  abnStatusEffectiveFrom: string;
  entityTypeCode: string;
  entityTypeDescription: string;
  state: string;
  postcode: string;
  gstRegistered: boolean;
  gstRegisteredFrom: string;
  dgrEndorsed: boolean;
  lastUpdated: string;
  offline?: boolean;
}

function getTag(tag: string, src: string): string {
  const m = src.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
  return m ? m[1].trim() : "";
}

/**
 * Look up an ABN in the Australian Business Register.
 * Returns an offline result (format-only) when ABR_GUID is not set.
 * Throws on network errors.
 */
export async function lookupAbnRegistry(abn: string): Promise<AbnLookupResult> {
  const digits = stripAbn(abn);
  const abnGuid = process.env.ABR_GUID || "";

  if (!abnGuid) {
    return {
      abn: digits,
      abnFormatted: formatAbn(digits),
      entityName: "ABR lookup unavailable — ABN format is valid",
      businessNames: [],
      tradingNames: [],
      abnStatus: "Valid (format only)",
      abnStatusEffectiveFrom: "",
      entityTypeCode: "",
      entityTypeDescription: "",
      state: "",
      postcode: "",
      gstRegistered: false,
      gstRegisteredFrom: "",
      dgrEndorsed: false,
      lastUpdated: new Date().toISOString(),
      offline: true,
    };
  }

  const url = `https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/SearchByABNv202001?searchString=${digits}&includeHistoricalDetails=N&authenticationGuid=${abnGuid}`;
  const abrRes = await fetch(url);
  const xml = await abrRes.text();

  const identifierValue = getTag("identifierValue", xml);
  if (!identifierValue) throw new Error("ABN not found in Australian Business Register");

  const abnStatusBlock = xml.match(/<entityStatus>([\s\S]*?)<\/entityStatus>/)?.[1] || "";
  const abnStatus = getTag("entityStatusCode", abnStatusBlock);
  const abnStatusFrom = getTag("effectiveFrom", abnStatusBlock);

  const entityTypeBlock = xml.match(/<entityType>([\s\S]*?)<\/entityType>/)?.[1] || "";
  const entityTypeCode = getTag("entityTypeCode", entityTypeBlock);
  const entityTypeDescription = getTag("entityDescription", entityTypeBlock);

  const mainNameBlock = xml.match(/<mainName>([\s\S]*?)<\/mainName>/)?.[1] || "";
  const legalNameBlock = xml.match(/<legalName>([\s\S]*?)<\/legalName>/)?.[1] || "";
  let entityName = getTag("organisationName", mainNameBlock);
  if (!entityName) {
    const givenName = getTag("givenName", legalNameBlock);
    const familyName = getTag("familyName", legalNameBlock);
    entityName = [givenName, familyName].filter(Boolean).join(" ");
  }

  const businessNameBlocks = xml.match(/<businessName>([\s\S]*?)<\/businessName>/g) || [];
  const businessNames = businessNameBlocks.map((b) => getTag("organisationName", b)).filter(Boolean);

  const tradingNameBlocks = xml.match(/<mainTradingName>([\s\S]*?)<\/mainTradingName>/g) || [];
  const tradingNames = tradingNameBlocks.map((b) => getTag("organisationName", b)).filter(Boolean);

  const addressBlock =
    xml.match(/<mainBusinessPhysicalAddress>([\s\S]*?)<\/mainBusinessPhysicalAddress>/)?.[1] || "";
  const state = getTag("stateCode", addressBlock);
  const postcode = getTag("postcode", addressBlock);

  const gstBlocks = xml.match(/<goodsAndServicesTax>([\s\S]*?)<\/goodsAndServicesTax>/g) || [];
  let gstRegistered = false;
  let gstRegisteredFrom = "";
  for (const b of gstBlocks) {
    const to = getTag("effectiveTo", b);
    if (!to || to === "0001-01-01") {
      gstRegistered = true;
      gstRegisteredFrom = getTag("effectiveFrom", b);
      break;
    }
  }

  const dgrBlocks = xml.match(/<dgrEndorsement>([\s\S]*?)<\/dgrEndorsement>/g) || [];
  const dgrEndorsed = dgrBlocks.length > 0;

  return {
    abn: digits,
    abnFormatted: formatAbn(digits),
    entityName,
    businessNames,
    tradingNames,
    abnStatus,
    abnStatusEffectiveFrom: abnStatusFrom,
    entityTypeCode,
    entityTypeDescription,
    state,
    postcode,
    gstRegistered,
    gstRegisteredFrom,
    dgrEndorsed,
    lastUpdated: new Date().toISOString(),
  };
}
