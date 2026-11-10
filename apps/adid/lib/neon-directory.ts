import { neon } from "@neondatabase/serverless";
import { verifiedPublicHref } from "./service-directory";
export type DirectoryResult = {status:"disabled"|"unavailable"|"ready"; entries:{id:string;name:string;href:string|null}[]};
/** Never read neon_auth users, sessions or passwords through this adapter. */
export async function getReadOnlyServiceDirectory():Promise<DirectoryResult>{
 if(process.env.ADID_NEON_DIRECTORY_ENABLED!=="true") return {status:"disabled",entries:[]};
 if(!process.env.DATABASE_URL)return {status:"unavailable",entries:[]};
 try {
  const sql=neon(process.env.DATABASE_URL);
  const rows=await sql`SELECT id,name,url FROM public.services WHERE is_active=true ORDER BY name ASC LIMIT 40`;
  const entries=[] as DirectoryResult["entries"];
  for(const x of rows){if(typeof x.id==="string"&&typeof x.name==="string")entries.push({id:x.id,name:x.name.slice(0,160),href:verifiedPublicHref(x.url)});}
  return {status:"ready",entries};
 }catch{return {status:"unavailable",entries:[]};}
}
