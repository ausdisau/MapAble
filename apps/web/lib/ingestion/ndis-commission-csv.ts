/** Official NDIS Commission provider-register CSV import contract.
 * Not the NDIA Provider Finder JSON, transitional SIL CSV, or worker screening.
 * Headers MUST be inspected and explicitly mapped against the downloaded file.
 */
import { createHash } from "node:crypto";
import { validAustralianAbn } from "@/lib/ingestion/ndis-outlet-import-core";

export const COMMISSION_REGISTER_CSV_URL =
 "https://www.ndiscommission.gov.au/provider-registration/find-registered-provider/download-csv";
export const REGISTRY_CSV_MAX_BYTES = 50 * 1024 * 1024;
export type ColumnMap = {
  registrationId: string;
  legalName: string;
  abn: string;
  status: string;
  businessName?: string;
  registrationEnd?: string;
  registrationGroups?: string;
};
export type RegistryRecord = {
  registrationId: string;
  legalName: string;
  businessName: string | null;
  abn: string | null;
  registrationStatus: string;
  registrationEnd: string | null;
  registrationGroups: readonly string[];
  rowHash: string;
};
export type RegistryPreview = {
  rawHash: string;
  headers: string[];
  rowCount: number;
  records: RegistryRecord[];
  rejected: number;
  duplicateConflicts: number;
  warningCodes: string[];
  safeToStage: boolean;
};
export function sha256(text: string) {
  return createHash("sha256").update(text).digest("hex");
}
/** Strict RFC4180-style CSV scanner. Never evaluates spreadsheet cells. */
export function parseCsv(text: string): string[][] {
  if (Buffer.byteLength(text,"utf8") > REGISTRY_CSV_MAX_BYTES) throw Error("REGISTRY_FILE_TOO_LARGE");
  const rows: string[][] = [];let row:string[]=[], cell="",quoted=false, afterQuote=false;
  for(let i=0;i<text.length;i++){
    const c=text[i]!;
    if(quoted){
      if(c==='"' && text[i+1]==='"'){cell+='"';i++}
      else if(c==='"'){quoted=false;afterQuote=true}
      else cell+=c;
    }else if(afterQuote) {
      if(c===','){row.push(cell);cell="";afterQuote=false}
      else if(c==='\r'||c==='\n'){row.push(cell);rows.push(row);row=[];cell="";afterQuote=false;if(c==='\r'&&text[i+1]==='\n')i++}
      else if(c!==' '&&c!=='\t')throw Error("REGISTRY_CSV_QUOTE_INVALID");
    }else if(c==='"'){
      if(cell!=="")throw Error("REGISTRY_CSV_QUOTE_INVALID");
      quoted=true;
    }else if(c===','){row.push(cell);cell=""}
    else if(c==='\r'||c==='\n'){
      row.push(cell);rows.push(row);row=[];cell="";
      if(c==='\r'&&text[i+1]==='\n')i++;
    }else cell+=c;
    if(cell.length>100000||row.length>160||rows.length>250000)throw Error("REGISTRY_CSV_LIMIT");
  }
  if(quoted)throw Error("REGISTRY_CSV_UNCLOSED_QUOTE");
  if(row.length||cell.length||afterQuote){row.push(cell);rows.push(row)}
  return rows.filter(r=>r.some(x=>x.trim()));
}
function normalized(s:string){return s.replace(/^\uFEFF/,"").trim().toLowerCase().replace(/\s+/g," ")}
function statusValue(v:string): string {
  const s=v.trim().toLowerCase();
  const known:Record<string,string>={
    approved:"Approved",registered:"Approved",suspended:"Suspended",
    revoked:"Revoked",cancelled:"Cancelled",canceled:"Cancelled",
    expired:"Expired","registered (applied for renewal)":"Registered (applied for renewal)",
  };
  return known[s]??"UNKNOWN";
}
function dateValue(s:string){const t=s.trim();return /^\d{4}-\d{2}-\d{2}$/.test(t)&&!Number.isNaN(Date.parse(t))?t:null}
function idCell(s:string){return s.trim().slice(0,140)}
function cleanName(s:string){return s.trim().slice(0,280)}
export function previewCommissionCsv(text:string, mapping?:ColumnMap): RegistryPreview {
  const rows=parseCsv(text);
  if(!rows.length)throw Error("REGISTRY_CSV_EMPTY");
  const headers=rows[0]!.map(s=>s.replace(/^\uFEFF/,"").trim());
  const names=headers.map(normalized);
  if(new Set(names).size!==names.length)throw Error("REGISTRY_CSV_DUPLICATE_HEADERS");
  // Never guess official column names from a different Commission CSV product.
  if(!mapping)return {rawHash:sha256(text),headers,rowCount:rows.length-1,records:[],
    rejected:0,duplicateConflicts:0,warningCodes:["COLUMN_MAPPING_REQUIRED"],safeToStage:false};
  const required=["registrationId","legalName","abn","status"] as const;
  const indexes:Record<string,number>={};
  for(const [key,value] of Object.entries(mapping)){
    const at=names.indexOf(normalized(value));
    if(at<0)throw Error("REGISTRY_MAPPING_COLUMN_MISSING:"+key);
    indexes[key]=at;
  }
  if(required.some(k=>indexes[k]===undefined)||new Set(Object.values(indexes)).size!==Object.values(indexes).length)
    throw Error("REGISTRY_MAPPING_INVALID");
  const records=new Map<string,RegistryRecord>(); let rejected=0,duplicateConflicts=0;
  const warnings=new Set<string>();
  for(const row of rows.slice(1)){
    if(row.length!==headers.length){rejected++;warnings.add("ROW_FIELD_COUNT");continue}
    const get=(key:string)=>indexes[key]===undefined?"":row[indexes[key]!]??"";
    const registrationId=idCell(get("registrationId"));
    const legalName=cleanName(get("legalName"));
    const status=statusValue(get("status"));
    if(!registrationId||!legalName||status==="UNKNOWN"){
      rejected++;warnings.add("REQUIRED_FIELD_OR_STATUS_UNKNOWN");continue;
    }
    const rawAbn=get("abn").replace(/[\s-]/g,"");
    const abn=rawAbn?validAustralianAbn(rawAbn):null;
    if(rawAbn&&!abn)warnings.add("ABN_INVALID_OR_UNAVAILABLE");
    const item:RegistryRecord={
      registrationId,legalName,businessName:cleanName(get("businessName"))||null,
      abn,registrationStatus:status,registrationEnd:dateValue(get("registrationEnd")),
      registrationGroups:get("registrationGroups").split(/[|;]/).map(s=>s.trim()).filter(Boolean),
      rowHash:sha256(JSON.stringify(row))
    };
    if(get("registrationEnd")&&!item.registrationEnd)warnings.add("DATE_UNRECOGNISED");
    const prior=records.get(registrationId);
    if(prior && prior.rowHash!==item.rowHash){duplicateConflicts++;warnings.add("REGISTRATION_ID_CONFLICT");}
    else if(!prior)records.set(registrationId,item);
  }
  const result=[...records.values()].sort((a,b)=>a.registrationId.localeCompare(b.registrationId));
  return {rawHash:sha256(text),headers,rowCount:rows.length-1,records:result,
    rejected,duplicateConflicts,warningCodes:[...warnings].sort(),
    safeToStage:result.length>0&&duplicateConflicts===0&&rejected===0&&!warnings.has("DATE_UNRECOGNISED")};
}
export type CrossSchemeFinding = {
  identity:"EXACT_VALID_ABN"|"NO_VALID_ABN"|"DIFFERENT_ABN";
  registration:"APPROVED_IN_SNAPSHOT"|"NON_APPROVED_IN_SNAPSHOT"|"UNKNOWN";
  workerScreening:"NOT_VERIFIED";
  availability:"UNKNOWN";
  verifiedToday:false;
};
export function crosswalkCommissionRecord(ndiaAbn:string|null, record:RegistryRecord):CrossSchemeFinding {
  const source=ndiaAbn?validAustralianAbn(ndiaAbn):null;
  return {identity:!source||!record.abn?"NO_VALID_ABN":source===record.abn?"EXACT_VALID_ABN":"DIFFERENT_ABN",
    registration:record.registrationStatus==="Approved"?"APPROVED_IN_SNAPSHOT":"NON_APPROVED_IN_SNAPSHOT",
    workerScreening:"NOT_VERIFIED",availability:"UNKNOWN",verifiedToday:false};
}
