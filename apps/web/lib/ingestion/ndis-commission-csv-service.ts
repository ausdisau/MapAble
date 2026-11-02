import { readFile, stat } from "node:fs/promises";

import { previewCommissionCsv, REGISTRY_CSV_MAX_BYTES, COMMISSION_REGISTER_CSV_URL, type ColumnMap } from "@/lib/ingestion/ndis-commission-csv";
import { prisma } from "@/lib/prisma";

export function requireCommissionWriteGate(env:Record<string,string|undefined>=process.env){
 if(env.NDIS_COMMISSION_CSV_WRITES_ENABLED!=="true")throw Error("COMMISSION_WRITE_GATE_OFF");
}
export async function readCommissionFile(file:string):Promise<string>{
 const st=await stat(file);if(!st.isFile()||st.size<1||st.size>REGISTRY_CSV_MAX_BYTES)throw Error("COMMISSION_FILE_INVALID");
 const body=await readFile(file,"utf8");if(Buffer.byteLength(body)>REGISTRY_CSV_MAX_BYTES)throw Error("COMMISSION_FILE_TOO_LARGE");
 return body;
}
export async function stageCommissionCsv(args:{file:string;mapping:ColumnMap;expectedSha256:string;operator:string}){
 requireCommissionWriteGate();
 if(!/^[a-z0-9_.@-]{3,120}$/i.test(args.operator))throw Error("OPERATOR_INVALID");
 const parsed=previewCommissionCsv(await readCommissionFile(args.file),args.mapping);
 if(parsed.rawHash!==args.expectedSha256)throw Error("SOURCE_HASH_CHANGED");
 if(!parsed.safeToStage)throw Error("SCHEMA_OR_QUALITY_REVIEW_REQUIRED");
 const run=await prisma.ndisCommissionRegisterImport.create({data:{
  sourceHash:parsed.rawHash,sourceUrl:COMMISSION_REGISTER_CSV_URL,rowCount:parsed.rowCount,
  recordCount:parsed.records.length,importedBy:args.operator,status:"staging"
 }});
 try{
  for(let i=0;i<parsed.records.length;i+=200){
   const chunk=parsed.records.slice(i,i+200);
   await prisma.ndisCommissionRegistration.createMany({data:chunk.map(x=>({
    importId:run.id,registrationId:x.registrationId,legalName:x.legalName,
    businessName:x.businessName,abn:x.abn,registrationStatus:x.registrationStatus,
    registrationEnd:x.registrationEnd,registrationGroups:[...x.registrationGroups],rowHash:x.rowHash,
   }))});
  }
  const count=await prisma.ndisCommissionRegistration.count({where:{importId:run.id}});
  if(count!==parsed.records.length)throw Error("STAGED_COUNTS_MISMATCH");
  await prisma.ndisCommissionRegisterImport.update({where:{id:run.id},data:{status:"staged"}});
  return {runId:run.id,sourceHash:parsed.rawHash,records:count,status:"staged" as const};
 }catch{
  await prisma.ndisCommissionRegisterImport.update({where:{id:run.id},data:{status:"failed"}});
  throw Error("COMMISSION_STAGE_FAILED");
 }
}
export async function publishCommissionCsv(args:{
 runId:string;expectedSha256:string;expectedPublishedRunId:string;operator:string;
 acknowledgementOfSnapshotDate:string;
}){
 requireCommissionWriteGate();
 if(!/^[a-z0-9_.@-]{3,120}$/i.test(args.operator))throw Error("OPERATOR_INVALID");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(args.acknowledgementOfSnapshotDate))throw Error("SOURCE_DATE_ACK_REQUIRED");
 if(!/^[a-f0-9]{64}$/.test(args.expectedSha256))throw Error("SOURCE_HASH_REQUIRED");
 return prisma.$transaction(async tx=>{
  const run=await tx.ndisCommissionRegisterImport.findUnique({where:{id:args.runId}});
  if(!run||run.status!=="staged"||run.sourceHash!==args.expectedSha256)throw Error("RUN_NOT_STAGED_OR_CHANGED");
  const old=await tx.ndisCommissionPublication.findUnique({where:{code:"registration-part-1"}});
  if((old?.importId??"none")!==args.expectedPublishedRunId)throw Error("PUBLICATION_POINTER_CHANGED");
  await tx.ndisCommissionPublication.upsert({where:{code:"registration-part-1"},
   create:{code:"registration-part-1",importId:run.id,publishedBy:args.operator},
   update:{importId:run.id,publishedBy:args.operator,publishedAt:new Date()}});
  return {published:true as const,runId:run.id,previousRunId:old?.importId??null,
   operatorAcknowledgedSourceDate:args.acknowledgementOfSnapshotDate};
 },{isolationLevel:"Serializable",timeout:30000});
}
