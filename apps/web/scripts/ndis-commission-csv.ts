#!/usr/bin/env npx tsx
import { readFile } from "node:fs/promises";

import { previewCommissionCsv, type ColumnMap } from "@/lib/ingestion/ndis-commission-csv";
import { readCommissionFile, stageCommissionCsv, publishCommissionCsv } from "@/lib/ingestion/ndis-commission-csv-service";
import { prisma } from "@/lib/prisma";
const val=(name:string)=>{const a=process.argv,i=a.indexOf("--"+name);return i>=0?a[i+1]??"":"";};
const required=(name:string)=>{const v=val(name);if(!v||v.startsWith("--"))throw Error("MISSING_ARG_"+name);return v;};
async function main(){
 const mode=val("mode")||"inspect";
 if(mode==="status"){
  const x=await prisma.ndisCommissionPublication.findUnique({where:{code:"registration-part-1"}});
  console.log(JSON.stringify({publishedRunId:x?.importId??null}));return;
 }
 if(mode==="publish"){
  if(!process.argv.includes("--confirm-publish"))throw Error("EXPLICIT_CONFIRMATION_REQUIRED");
  console.log(JSON.stringify(await publishCommissionCsv({
   runId:required("run-id"),expectedSha256:required("sha256"),
   expectedPublishedRunId:required("previous-run"),operator:required("operator"),
   acknowledgementOfSnapshotDate:required("source-date") })));return;
 }
 const file=required("file");
 const text=await readCommissionFile(file);
 const mapfile=val("map");
 const mapping:ColumnMap|undefined=mapfile?JSON.parse(await readFile(mapfile,"utf8")) as ColumnMap:undefined;
 const preview=previewCommissionCsv(text,mapping);
 const summary={sha256:preview.rawHash,headers:preview.headers,rowCount:preview.rowCount,
  parsed:preview.records.length,rejected:preview.rejected,duplicateConflicts:preview.duplicateConflicts,
  warnings:preview.warningCodes,safeToStage:preview.safeToStage};
 if(mode==="inspect"||mode==="preview"){console.log(JSON.stringify(summary,null,2));return;}
 if(mode!=="stage")throw Error("UNKNOWN_MODE");
 if(!mapping)throw Error("COLUMN_MAPPING_REQUIRED");
 console.log(JSON.stringify(await stageCommissionCsv({
  file,mapping,expectedSha256:required("sha256"),operator:required("operator")})));
}
main().catch(e=>{console.error(e instanceof Error?e.message:"IMPORT_FAILED");process.exitCode=1})
 .finally(async()=>prisma.$disconnect());
