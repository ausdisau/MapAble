import { NextResponse } from "next/server";

import { getAuspostPacDiagnostics } from "@/lib/config/auspost-pac";

/** Non-secret check that suburb enrichment env is visible to serverless functions. */
export async function GET() {
  return NextResponse.json(getAuspostPacDiagnostics());
}
