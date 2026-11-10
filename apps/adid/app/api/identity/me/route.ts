import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
export const dynamic="force-dynamic";
export async function GET(){
 const {userId,sessionId}=await auth();
 if(!userId||!sessionId)return NextResponse.json({authenticated:false},{status:401,headers:{"Cache-Control":"no-store"}});
 return NextResponse.json({authenticated:true,subject:userId,issuer:"clerk",authorisedServices:[],notice:"No external account links or grants are asserted."},{headers:{"Cache-Control":"no-store"}});
}
